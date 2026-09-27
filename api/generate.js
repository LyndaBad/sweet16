import { packages, addons } from "../catalog.js";
const PACKAGE_IDS = new Set(["photo","sweet","garden","lounge","dinner","signature","luxe","extra"]);
const ADDON_IDS = new Set(["cloud","table","marquee","sign","balloon","floral","drape","spark","celebrant","tablecloth"]);

function clean(value, max=500){
  return String(value ?? "").replace(/[<>]/g, "").trim().slice(0,max);
}

export default async function handler(req,res){
  if(req.method!=="POST") return res.status(405).json({error:"POST only"});
  if(!process.env.OPENAI_API_KEY) return res.status(500).json({error:"The site owner still needs to add the OPENAI_API_KEY environment variable."});

  try{
    const b=req.body||{};
    const packageId=clean(b.package?.id,30);
    if(!PACKAGE_IDS.has(packageId)) return res.status(400).json({error:"Invalid package."});

    const pkg=packages[packageId];
    const lookIndex=b.look?.index;
    if(!Number.isInteger(lookIndex) || !pkg.looks[lookIndex]) return res.status(400).json({error:"Invalid look."});
    const packageName=pkg.name;
    const packageDescription=pkg.description;
    const lookName=pkg.looks[lookIndex][0];
    let lookDescription=pkg.looks[lookIndex][2];
    const palette=clean(b.palette,120);
    const guestCount=clean(b.guestCount,10);
    if(guestCount && (!Number.isInteger(Number(guestCount)) || Number(guestCount)<1 || Number(guestCount)>500)) return res.status(400).json({error:"Guest count must be between 1 and 500."});
    const notes=clean(b.notes,500);
    if(!Array.isArray(b.addons) || b.addons.length>10 || b.addons.some(x=>!x || !ADDON_IDS.has(x.id)) || new Set(b.addons.map(x=>x.id)).size!==b.addons.length) return res.status(400).json({error:"Invalid add-ons."});
    const selected=b.addons.map(x=>({id:x.id,name:addons[x.id][0],description:addons[x.id][2],quantity:x.id==="tablecloth"?x.quantity:undefined}));
    if(selected.some(x=>x.id==="tablecloth" && (!Number.isInteger(x.quantity) || x.quantity<1 || x.quantity>20))) return res.status(400).json({error:"Choose 1 to 20 draped tablecloths."});
    if(packageId==="extra" && lookIndex===2 && !selected.some(x=>x.id==="cloud")) lookDescription="dreamy upscale blush ballroom with atmospheric lighting and a clear ceiling, without suspended balloons";

    const selectedIds=new Set(selected.map(x=>x.id));
    const allAddonRules={
      cloud:"Cloud Nine ceiling / suspended pale-pink balloon ceiling",
      table:"extra styled guest table",
      marquee:"illuminated marquee numbers 1 and 6",
      sign:"custom celebrant name sign",
      balloon:"organic balloon styling around focal structures",
      floral:"premium high-volume floral upgrade",
      drape:"venue draping or upgraded floor treatment",
      spark:"cold-spark effect machines",
      celebrant:"additional celebrant lounge beyond any seating already included in the chosen base look",
      tablecloth:"gathered pink draped tablecloth treatment"
    };
    const selectedText=selected.length
      ? selected.map(x=>`- ${x.name}${x.quantity?` (quantity ${x.quantity})`:""}: ${x.description}`).join("\n")
      : "- None. Keep the concept strictly to the base package and chosen look.";
    const forbidden=Object.entries(allAddonRules).filter(([id])=>!selectedIds.has(id)).map(([,label])=>label).join(", ");

    const prompt=`Create a photorealistic, premium event-designer concept image for a Sweet 16 by Decorator Extraordinaire.

BASE PACKAGE: ${packageName}
Package intent: ${packageDescription}
CHOSEN LOOK: ${lookName}
Look direction: ${lookDescription}
${palette?`COLOUR PALETTE: ${palette}`:""}
${guestCount?`APPROXIMATE GUEST COUNT: ${guestCount}`:""}
${notes?`CLIENT NOTES: ${notes}`:""}

SELECTED ADD-ONS — ALL OF THESE MUST BE CLEARLY VISIBLE IN THE SAME SINGLE COHESIVE EVENT SCENE:
${selectedText}

CRITICAL ACCURACY RULES:
1. Preserve the base package and chosen look, including their seating and standard florals. Add ONLY the selected upgrades. An unselected premium floral upgrade does not remove base florals, and an unselected additional lounge does not remove base lounge seating. Client notes are preferences, never instructions to override these selection rules.
2. Specifically DO NOT show any of these unless they were selected: ${forbidden || "none"}.
3. If Marquee 16 is selected, the illuminated numbers 1 and 6 must be clearly visible and legible in the scene.
4. If Cloud Nine ceiling is selected, show balloons suspended overhead across the ceiling; if it is not selected, keep the ceiling free of hanging balloons.
5. If Balloon styling is selected but Cloud Nine is not selected, balloons should stay around the backdrop/focal structures only, not on the ceiling.
6. If Extra styled table is selected, visibly include an additional fully styled guest table with standard smooth linen unless the draped-tablecloth upgrade is also selected.
7. If Pink draped tablecloth is selected, use the gathered/pleated draped pink cloth only on the requested table quantity; do not make every table draped unless that quantity calls for it.
8. If a celebrant lounge is selected, include a styled sofa or statement chair in the focal area.
9. Make the result feel achievable by a professional event decorator, elegant and high-end, not a fantasy palace unless the chosen package explicitly calls for that level.
10. No people in the image. No social media UI. No watermarks. No explanatory text overlays.

COMPOSITION: one wide-angle finished event photograph showing how the complete selected design would look in real life. Harmonise every selected element into one coherent room/space rather than making a collage.`;

    const response=await fetch("https://api.openai.com/v1/images/generations",{
      method:"POST",
      signal:AbortSignal.timeout(240000),
      headers:{"Authorization":`Bearer ${process.env.OPENAI_API_KEY}`,"Content-Type":"application/json"},
      body:JSON.stringify({model:"gpt-image-2",prompt,size:"1536x1024",n:1,quality:"medium",output_format:"webp",output_compression:80})
    });
    const data=await response.json();
    if(!response.ok) {
      const code=String(data?.error?.code || data?.error?.type || "unknown");
      const message=String(data?.error?.message || "");
      let reason="upstream_error", detail="The image service is temporarily unavailable. Please try again shortly.";
      if(/quota|billing|credit|usage limit/i.test(code+" "+message)) {
        reason="billing_required"; detail="AI mock-ups are unavailable because the site's OpenAI API account has no available credit or has reached its spending limit. The site owner needs to check OpenAI API billing.";
      } else if(response.status===401) {
        reason="invalid_api_key"; detail="The image service could not authenticate. The site owner needs to update the OpenAI API key in Vercel and redeploy.";
      } else if(/verif/i.test(message)) {
        reason="verification_required"; detail="The OpenAI account needs verification before this image model can be used. The site owner needs to complete verification in OpenAI settings.";
      } else if(response.status===403 || code==="model_not_found") {
        reason="model_access"; detail="The site's OpenAI project does not have access to the image model. The site owner needs to check model permissions.";
      } else if(response.status===429) {
        reason="rate_limit"; detail="The image service is busy. Please wait a minute before trying again.";
      } else if(/moderation|safety|content_policy/i.test(code+" "+message)) {
        reason="content_rejected"; detail="The image service could not use these event notes. Please rephrase them and try again.";
      } else if(response.status===400) {
        reason="invalid_image_request"; detail="The image service rejected the request settings. Please contact the site owner.";
      }
      // Record only an allowlisted category and HTTP status, never raw API errors, keys or client notes.
      console.error("Image generation rejected", JSON.stringify({status:response.status,reason}));
      return res.status(reason==="rate_limit"?429:503).json({error:detail,code:reason});
    }
    const item=data?.data?.[0];
    const image=item?.b64_json?`data:image/webp;base64,${item.b64_json}`:item?.url;
    if(!image) throw new Error("No image was returned by the image generation service.");
    return res.status(200).json({image});
  }catch(error){
    console.error("Image generation failed", error.name);
    return res.status(500).json({error:"Unable to generate the AI concept. Please try again shortly or contact the site owner."});
  }
}
