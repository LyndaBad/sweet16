import test from 'node:test';
import assert from 'node:assert/strict';
import handler from '../api/generate.js';
import { buildPrompt } from '../image-prompt.js';
import { packages, addons } from '../catalog.js';
const payload=(addons=[],id='sweet',index=0)=>({package:{id},look:{index},addons});
async function invoke(body,method='POST') {const r={statusCode:200,status(n){this.statusCode=n;return this},json(data){this.data=data;return this}};await handler({method,body},r);return r;}
test('all 24576 package/look/add-on combinations fit without dropping required selections',()=>{
 const ids=Object.keys(addons);
 for(const pkg of Object.values(packages)) for(const look of pkg.looks) for(let mask=0;mask<1024;mask++) {
  const selected=ids.filter((_,i)=>mask&(1<<i)).map(id=>({id,quantity:20}));
  const prompt=buildPrompt({packageName:pkg.name,packageDescription:pkg.description,lookName:look[0],lookDescription:look[2],selected,palette:'p'.repeat(120),guestCount:'500',notes:'n'.repeat(500)});
  assert.ok(prompt.length<=2048);
  if(selected.some(x=>x.id==='tablecloth'))assert.match(prompt,/exactly 20 tables/);
  if(selected.some(x=>x.id==='marquee'))assert.match(prompt,/large glowing numbers "1" and "6"/);
 }
});
test('OpenAI endpoint, validation, successful output, safe errors',async()=>{
 const fetchBefore=globalThis.fetch,envBefore={...process.env};
 try {
  delete process.env.OPENAI_API_KEY;
  assert.equal((await invoke(payload(),'GET')).statusCode,405);
  assert.equal((await invoke(payload())).statusCode,503);
  process.env.OPENAI_API_KEY='test-secret';
  let sent;
  globalThis.fetch=async(url,options)=>{assert.equal(url,"https://api.openai.com/v1/images/generations");sent=JSON.parse(options.body);assert.equal(options.headers.Authorization,'Bearer test-secret');return {ok:true,json:async()=>({data:[{b64_json:'dGVzdA=='}]})}};
  for(const id of Object.keys(packages))for(let i=0;i<3;i++){assert.equal((await invoke(payload([],id,i))).statusCode,200);assert.equal(sent.quality,"medium");assert.equal(sent.model,"gpt-image-2");assert.equal(sent.size,"1536x1024");assert.equal(sent.n,1);}
  const response=await invoke(payload([{id:'marquee'},{id:'tablecloth',quantity:3}]));
  assert.equal(response.data.image,'data:image/jpeg;base64,dGVzdA==');assert.match(sent.prompt,/exactly 3 tables/);assert.match(sent.prompt,/Clear ceiling/);
  await invoke(payload([{id:'cloud'}]));assert.match(sent.prompt,/Ceiling balloon installation visible/);
  for(const body of [payload([{id:'bad'}]),payload([{id:'tablecloth',quantity:0}]),payload([{id:'cloud'},{id:'cloud'}]),payload([],'sweet',55)]) assert.equal((await invoke(body)).statusCode,400);
  for(const [status,message,reason] of [[429,'insufficient_quota','billing_required'],[401,'test-secret','connection_required'],[429,'busy','rate_limit'],[500,'internal sensitive text','upstream_error']]){
   globalThis.fetch=async()=>({ok:false,status,json:async()=>({error:{message}})});const r=await invoke(payload());assert.equal(r.data.code,reason);assert.doesNotMatch(r.data.error,/test-secret|internal sensitive/);
  }
  globalThis.fetch=async()=>({ok:true,json:async()=>({success:true,result:{}})});assert.equal((await invoke(payload())).statusCode,502);
 }finally{globalThis.fetch=fetchBefore;for(const key of ['OPENAI_API_KEY'])if(envBefore[key]===undefined)delete process.env[key];else process.env[key]=envBefore[key];}
});

test('each event uses its own canonical packages and rejects cross-event selections',async()=>{
 const {events}=await import('../events.js');const before=globalThis.fetch,key=process.env.OPENAI_API_KEY;process.env.OPENAI_API_KEY='test';let prompt;
 globalThis.fetch=async(u,o)=>{prompt=JSON.parse(o.body).prompt;return {ok:true,json:async()=>({data:[{b64_json:'dGVzdA=='}]})}};
 try{
 for(const [eventId,event] of Object.entries(events))for(const id of Object.keys(event.packages))for(let index=0;index<3;index++){
 const r=await invoke({...payload([],id,index),eventId});assert.equal(r.statusCode,200);assert.ok(prompt.includes(event.packages[id].name));
 }
 assert.equal((await invoke({...payload(),eventId:'invalid'})).statusCode,400);
 assert.equal((await invoke({...payload([{id:'marquee'}],'ceremony'),eventId:'weddings'})).statusCode,400);
 await invoke({...payload([],'heritage'),eventId:'traditional',heritage:'Yoruba and Igbo'});assert.match(prompt,/Yoruba and Igbo/);assert.match(prompt,/Do not mix or invent/);
 await invoke({...payload([{id:'marquee'}],'party'),eventId:'birthdays',birthdayAge:'40'});assert.match(prompt,/Birthday age: 40/);
 }finally{globalThis.fetch=before;if(key===undefined)delete process.env.OPENAI_API_KEY;else process.env.OPENAI_API_KEY=key;}
});

test('priced event collections have photos, finite addon prices and wedding order',async()=>{
 const {events,eventOrder}=await import('../events.js');
 assert.deepEqual(eventOrder,['sweet16','proposals','birthdays','weddings','traditional']);
 assert.equal(events.traditional.name,'African Traditional Weddings');
 for(const event of Object.values(events)){
 for(const pkg of Object.values(event.packages)){assert.ok(pkg.price>0);assert.equal(pkg.looks.length,3);for(const look of pkg.looks)assert.ok(look[1]);}
 for(const addon of Object.values(event.addons))assert.ok(addon[1]>0);
 }
 assert.match(events.traditional.packages.heritage.looks[0][0],/Nigerian/);
 assert.match(events.traditional.packages.heritage.looks[1][0],/Ghanaian/);
});
