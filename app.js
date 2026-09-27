import { packages, addons } from "./catalog.js";

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
    label.innerHTML = `<span><strong>${p.name}</strong><small>from ${money(p.price)}</small></span><input type="radio" name="package" ${state.packageId===id?"checked":""}>`;
    label.addEventListener("click", () => { state.packageId=id; state.lookIndex=0; renderAll(); });
    host.appendChild(label);
  });
}

function renderLooks(){
  const host = $("lookList"); host.innerHTML = "";
  packages[state.packageId].looks.forEach((look,i) => {
    const btn=document.createElement("button");
    btn.type="button"; btn.className="look-card"+(state.lookIndex===i?" selected":"");
    btn.innerHTML=`<img src="${look[1]}" alt="${look[0]}"><span>${look[0]}</span>`;
    btn.addEventListener("click",()=>{state.lookIndex=i;renderLooks();updateSummary();});
    host.appendChild(btn);
  });
}

function renderAddons(){
  const host=$("addonList"); host.innerHTML="";
  Object.entries(addons).forEach(([id,a])=>{
    const label=document.createElement("label");
    label.className="choice-card"+(state.selectedAddons.has(id)?" selected":"");
    const suffix=id==="tablecloth"?`${money(a[1])}+ per table`:`+${money(a[1])}`;
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
  $("estimate").textContent=money(estimate())+"+";
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
    package:{id:state.packageId,name:p.name,description:p.description},
    look:{index:state.lookIndex},
    addons:selected,
    palette:$("palette").value.trim(),
    guestCount:$("guestCount").value,
    notes:$("notes").value.trim()
  };
  const btn=$("generateBtn"); btn.disabled=true; btn.textContent="Generating…";
  $("status").className="status"; $("status").textContent="Creating one complete Sweet 16 concept from your exact selections. This can take a little while.";
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
["palette","guestCount","notes"].forEach(id=>$(id).addEventListener("input",updateSummary));
setupQty();renderAll();
