import { buildPrompt } from "../image-prompt.js";
import { events } from "../events.js";
const PACKAGE_IDS = new Set(["photo","sweet","garden","lounge","dinner","signature","luxe","extra"]);
const ADDON_IDS = new Set(["cloud","table","marquee","sign","balloon","floral","drape","spark","celebrant","tablecloth"]);

function clean(value, max=500){
  return String(value ?? "").replace(/[<>]/g, "").trim().slice(0,max);
}

export default async function handler(req,res){
  if(req.method!=="POST") return res.status(405).json({error:"POST only"});
  if(!process.env.OPENAI_API_KEY) return res.status(503).json({error:"The site owner needs to connect the OpenAI image service."});

  try{
    const b=req.body||{};
    const eventId=clean(b.eventId||"sweet16",30);
    const event=Object.hasOwn(events,eventId)?events[eventId]:null;
    if(!event) return res.status(400).json({error:"Invalid event type."});
    const {packages,addons}=event;
    const packageId=clean(b.package?.id,30);
    if(!Object.hasOwn(packages,packageId)) return res.status(400).json({error:"Invalid package."});

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
    if(!Array.isArray(b.addons) || b.addons.length>10 || b.addons.some(x=>!x || !Object.hasOwn(addons,x.id)) || new Set(b.addons.map(x=>x.id)).size!==b.addons.length) return res.status(400).json({error:"Invalid add-ons."});
    const selected=b.addons.map(x=>({id:x.id,name:addons[x.id][0],description:addons[x.id][2],quantity:x.id==="tablecloth"?x.quantity:undefined}));
    if(selected.some(x=>x.id==="tablecloth" && (!Number.isInteger(x.quantity) || x.quantity<1 || x.quantity>20))) return res.status(400).json({error:"Choose 1 to 20 draped tablecloths."});
    if(eventId==="sweet16" && packageId==="extra" && lookIndex===2 && !selected.some(x=>x.id==="cloud")) lookDescription="dreamy upscale blush ballroom with atmospheric lighting and a clear ceiling, without suspended balloons";

    const birthdayAge=clean(b.birthdayAge,3);
    if(birthdayAge && (!Number.isInteger(Number(birthdayAge)) || Number(birthdayAge)<1 || Number(birthdayAge)>120)) return res.status(400).json({error:"Birthday age must be from 1 to 120."});
    const prompt=buildPrompt({eventId,eventName:event.name,heritage:clean(b.heritage,300),birthdayAge,packageName,packageDescription,lookName,lookDescription,selected,palette,guestCount,notes});
    const response=await fetch("https://api.openai.com/v1/images/generations",{
      method:"POST",
      signal:AbortSignal.timeout(120000),
      headers:{"Authorization":`Bearer ${process.env.OPENAI_API_KEY}`,"Content-Type":"application/json"},
      body:JSON.stringify({model:"gpt-image-2",prompt,n:1,size:"1536x1024",quality:"medium",output_format:"jpeg"})
    });
    const data=await response.json();
    if(!response.ok || data.error) {
      const internal=JSON.stringify(data.error || {});
      let reason="upstream_error", detail="The image service is temporarily unavailable. Please try again shortly.";
      if(/billing|quota|insufficient_quota/i.test(internal)) {
        reason="billing_required"; detail="OpenAI image generation needs available API credit. The site owner needs to check OpenAI billing.";
      } else if(response.status===401 || response.status===403) {
        reason="connection_required"; detail="The image service could not authenticate. The site owner needs to check the OpenAI connection.";
      } else if(response.status===429) {
        reason="rate_limit"; detail="The image service is busy. Please wait a minute and try again.";
      } else if(/moderation|safety|content_policy/i.test(internal)) {
        reason="content_rejected"; detail="Please rephrase your event notes and try again.";
      }
      console.error("Image generation rejected",JSON.stringify({status:response.status,reason}));
      return res.status(reason==="rate_limit" || reason==="billing_required"?429:503).json({error:detail,code:reason});
    }
    const encoded=data.data?.[0]?.b64_json;
    if(typeof encoded!=="string" || !encoded.length || !/^[A-Za-z0-9+/=]+$/.test(encoded)) throw new Error("Invalid image response");
    return res.status(200).json({image:`data:image/jpeg;base64,${encoded}`});
  }catch(error){
    console.error("Image generation failed",error.name);
    const timeout=error.name==="TimeoutError" || error.name==="AbortError";
    return res.status(timeout?504:502).json({error:timeout?"The image took too long to generate. Please try again.":"Unable to generate the AI concept. Please try again shortly."});
  }
}
