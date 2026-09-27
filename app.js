import { events, enquiryEmail } from "./events.js";
let eventId="sweet16";
let {packages,addons}=events[eventId];
const savedStates={};

let generating = false;
let selectionRevision = 0;
let state = { packageId: "sweet", lookIndex: 0, selectedAddons: new Set(), tableQty: 1 };

const $ = (id) => document.getElementById(id);
const money = (v) => `$${Number(v).toLocaleString()}`;

function renderPackages(){
  const host = $("packageList"); host.innerHTML = "";
  Object.entries(packages).forEach(([id,p]) => {
    const label = document.createElement("label");
    label.className = "choice-card" + (state.packageId === id ? " selected" : "");
    label.innerHTML = `<span><strong>${p.name}</strong><small>${p.price===null?"Request a quote":"from "+money(p.price)}</small></span><input type="radio" name="package" ${state.packageId===id?"checked":""}>`;
    label.addEventListener("click", () => { state.packageId=id; state.lookIndex=0; renderAll(); });
    host.appendChild(label);
  });
}

function renderLooks(){
  const host = $("lookList"); host.innerHTML = "";
  packages[state.packageId].looks.forEach((look,i) => {
    const btn=document.createElement("button");
    btn.type="button"; btn.className="look-card"+(state.lookIndex===i?" selected":"");
    btn.innerHTML=`${look[1]?`<img src="${look[1]}" alt="${look[0]}">`:`<div class="look-swatch swatch-${i}" aria-hidden="true">✦</div>`}<span>${look[0]}</span>`;
    btn.addEventListener("click",()=>{state.lookIndex=i;renderLooks();updateSummary();});
    host.appendChild(btn);
  });
}

function renderAddons(){
  const host=$("addonList"); host.innerHTML="";
  Object.entries(addons).forEach(([id,a])=>{
    const label=document.createElement("label");
    label.className="choice-card"+(state.selectedAddons.has(id)?" selected":"");
    const suffix=a[1]===null?"Priced with your quote":id==="tablecloth"?`${money(a[1])}+ per table`:`+${money(a[1])}`;
    label.innerHTML=`<span><strong>${a[0]}</strong><small>${suffix}</small></span><input type="checkbox" ${state.selectedAddons.has(id)?"checked":""}>`;
    label.addEventListener("click",(e)=>{e.preventDefault();state.selectedAddons.has(id)?state.selectedAddons.delete(id):state.selectedAddons.add(id);renderAddons();updateSummary();});
    host.appendChild(label);
  });
  $("tableclothQuantity").classList.toggle("hidden",!state.selectedAddons.has("tablecloth"));
}

function setupQty(){
  const select=$("tableQty");
  select.innerHTML=Array.from({length:20},(_,i)=>`<option value="${i+1}">${i+1} table${i?"s":""}</option>`).join("");
  select.value=String(state.tableQty);
  select.addEventListener("change",()=>{state.tableQty=Number(select.value);updateSummary();});
}

function estimate(){
  let total=packages[state.packageId].price;
  state.selectedAddons.forEach(id=> total += id==="tablecloth" ? addons[id][1]*state.tableQty : addons[id][1]);
  return total;
}

function updateSummary(){
  selectionRevision++;
  $("generatedImage").classList.add("hidden");
  $("resultActions").classList.add("hidden");
  $("emptyState").classList.remove("hidden");
  $("aiResult").classList.add("empty-result");
  $("status").textContent = generating ? "Selections changed. Generate again when the current request finishes." : "";
  const p=packages[state.packageId], look=p.looks[state.lookIndex];
  $("summaryTitle").textContent=p.name;
  $("summaryText").textContent=p.description;
  $("estimate").textContent=p.price===null?"Request a quote":money(estimate())+"+";
  $("selectedLook").textContent=look[0];
  const list=[...state.selectedAddons].map(id=> id==="tablecloth"?`${addons[id][0]} × ${state.tableQty}`:addons[id][0]);
  $("selectedAddons").textContent=list.length?list.join(", "):"None selected";
}

function renderAll(){renderPackages();renderLooks();renderAddons();updateSummary();}

async function generate(){
  if(generating) return;
  generating = true;
  const revision = selectionRevision;
  $("regenerateBtn").disabled = true;
  const p=packages[state.packageId], look=p.looks[state.lookIndex];
  const selected=[...state.selectedAddons].map(id=>({id,name:addons[id][0],description:addons[id][2],quantity:id==="tablecloth"?state.tableQty:undefined}));
  const payload={
    eventId,
    birthdayAge:$("birthdayAge").value,
    heritage:$("heritage").value.trim(),
    package:{id:state.packageId,name:p.name,description:p.description},
    look:{index:state.lookIndex},
    addons:selected,
    palette:$("palette").value.trim(),
    guestCount:$("guestCount").value,
    notes:$("notes").value.trim()
  };
  const btn=$("generateBtn"); btn.disabled=true; btn.textContent="Generating…";
  $("status").className="status"; $("status").textContent="Creating your complete event concept. This can take a little while.";
  try{
    const r=await fetch("/api/generate",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});
    const data=await r.json();
    if(!r.ok) throw new Error(data.error||"The AI preview could not be generated.");
    if(revision !== selectionRevision) { $("status").textContent="Your selections changed. Generate a new concept for the current design."; return; }
    const img=$("generatedImage"); img.src=data.image; img.classList.remove("hidden");
    $("emptyState").classList.add("hidden"); $("aiResult").classList.remove("empty-result");
    $("downloadBtn").href=data.image; $("resultActions").classList.remove("hidden");
    $("status").textContent="Your holistic AI concept is ready.";
  }catch(err){
    $("status").className="status error"; $("status").textContent=err.message;
  }finally{generating=false;$("regenerateBtn").disabled=false;btn.disabled=false;btn.textContent="Generate AI mock-up";}
}

$("generateBtn").addEventListener("click",generate);
$("regenerateBtn").addEventListener("click",generate);
["palette","guestCount","notes","birthdayAge","heritage"].forEach(id=>$(id).addEventListener("input",updateSummary));
function switchEvent(id){
 savedStates[eventId]={state,palette:$("palette").value,guestCount:$("guestCount").value,notes:$("notes").value,birthdayAge:$("birthdayAge").value,heritage:$("heritage").value};
 eventId=id; const event=events[id]; ({packages,addons}=event);
 const saved=savedStates[id]; state=saved?.state||{packageId:event.defaultPackage,lookIndex:0,selectedAddons:new Set(),tableQty:1};
 for(const field of ["palette","guestCount","notes","birthdayAge","heritage"]) $(field).value=saved?.[field]||"";
 $("palette").placeholder=event.palette; $("tableQty").value=state.tableQty;
 $("eventTitle").textContent=event.title; $("eventIntro").textContent=event.intro; $("eventEyebrow").textContent=event.name+" Designer";
 $("builderTitle").textContent="Design your "+event.name.toLowerCase();
 $("birthdayField").classList.toggle("hidden",id!=="birthdays");$("heritageField").classList.toggle("hidden",id!=="traditional");
 $("heroImage").classList.toggle("hidden",id!=="sweet16");$("eventArtwork").classList.toggle("hidden",id==="sweet16");$("eventArtwork").textContent=event.name;
 $("downloadBtn").download=id+"-decor-concept.jpg";$("generatedImage").alt="AI-generated "+event.name+" concept";
 document.querySelectorAll('.event-tab').forEach(btn=>{btn.setAttribute('aria-pressed',String(btn.dataset.event===id));});
 document.body.dataset.event=id; renderAll();
}
for(const [id,event] of Object.entries(events)){
 const btn=document.createElement("button");btn.className="event-tab";btn.type="button";btn.dataset.event=id;btn.textContent=event.name;btn.setAttribute("aria-pressed",String(id===eventId));btn.addEventListener("click",()=>switchEvent(id));$("eventTabs").appendChild(btn);
}
$("enquiryForm").addEventListener("submit",e=>{
 e.preventDefault(); const event=events[eventId],pkg=packages[state.packageId];
 const body=["Hello Decorator Extraordinaire,", "I'd like to enquire about my event design.","", "Name: "+$("customerName").value,"Reply email: "+$("customerEmail").value,"Event: "+event.name,"Date: "+$("eventDate").value,"Venue: "+$("venue").value,"Package: "+pkg.name,"Look: "+pkg.looks[state.lookIndex][0],"Extras: "+$("selectedAddons").textContent,"Estimate: "+$("estimate").textContent,"Palette: "+$("palette").value,"Guests: "+$("guestCount").value,"Birthday age: "+$("birthdayAge").value,"Heritage / customs: "+$("heritage").value,"Notes: "+$("notes").value,"", "I can attach my saved AI concept to this email."].join("\n");
 window.location.href="mailto:"+enquiryEmail+"?subject="+encodeURIComponent(event.name+" decor enquiry — "+pkg.name)+"&body="+encodeURIComponent(body);
 $("enquiryStatus").textContent="Your email app will open. Review the enquiry and press Send. You can attach your saved concept image.";
});
setupQty();switchEvent("sweet16");
