import { buildPrompt } from "../image-prompt.js";
import { packages, addons } from "../catalog.js";
const PACKAGE_IDS = new Set(["photo","sweet","garden","lounge","dinner","signature","luxe","extra"]);
const ADDON_IDS = new Set(["cloud","table","marquee","sign","balloon","floral","drape","spark","celebrant","tablecloth"]);

function clean(value, max=500){
  return String(value ?? "").replace(/[<>]/g, "").trim().slice(0,max);
}

export default async function handler(req,res){
  if(req.method!=="POST") return res.status(405).json({error:"POST only"});
  if(!process.env.CLOUDFLARE_API_TOKEN || !/^[a-f0-9]{32}$/i.test(process.env.CLOUDFLARE_ACCOUNT_ID || "")) return res.status(503).json({error:"The site owner needs to finish connecting the free image service."});

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

    const prompt=buildPrompt({packageName,packageDescription,lookName,lookDescription,selected,palette,guestCount,notes});
    const response=await fetch(`https://api.cloudflare.com/client/v4/accounts/${process.env.CLOUDFLARE_ACCOUNT_ID}/ai/run/@cf/black-forest-labs/flux-1-schnell`,{
      method:"POST",
      signal:AbortSignal.timeout(120000),
      headers:{"Authorization":`Bearer ${process.env.CLOUDFLARE_API_TOKEN}`,"Content-Type":"application/json"},
      body:JSON.stringify({prompt,steps:4})
    });
    const data=await response.json();
    if(!response.ok || data.success===false) {
      const internal=JSON.stringify(data.errors || []);
      let reason="upstream_error", detail="The free image service is temporarily unavailable. Please try again shortly.";
      if(/daily|quota|neurons|allocation/i.test(internal)) {
        reason="daily_limit"; detail="Today's free AI allowance has been used. Please try again after midnight UTC when it resets.";
      } else if(response.status===401 || response.status===403) {
        reason="connection_required"; detail="The free image service could not authenticate. The site owner needs to check the Cloudflare connection.";
      } else if(response.status===429) {
        reason="rate_limit"; detail="The image service is busy. Please wait a minute and try again.";
      } else if(/moderation|safety|content_policy/i.test(internal)) {
        reason="content_rejected"; detail="Please rephrase your event notes and try again.";
      }
      console.error("Image generation rejected",JSON.stringify({status:response.status,reason}));
      return res.status(reason==="rate_limit" || reason==="daily_limit"?429:503).json({error:detail,code:reason});
    }
    const encoded=data.result?.image;
    if(typeof encoded!=="string" || !encoded.length || !/^[A-Za-z0-9+/=]+$/.test(encoded)) throw new Error("Invalid image response");
    return res.status(200).json({image:`data:image/jpeg;base64,${encoded}`});
  }catch(error){
    console.error("Image generation failed",error.name);
    const timeout=error.name==="TimeoutError" || error.name==="AbortError";
    return res.status(timeout?504:502).json({error:timeout?"The image took too long to generate. Please try again.":"Unable to generate the AI concept. Please try again shortly."});
  }
}
