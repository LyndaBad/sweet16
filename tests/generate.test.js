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
test('Cloudflare endpoint, validation, successful output, safe errors',async()=>{
 const fetchBefore=globalThis.fetch,envBefore={...process.env};
 try {
  delete process.env.CLOUDFLARE_API_TOKEN;delete process.env.CLOUDFLARE_ACCOUNT_ID;
  assert.equal((await invoke(payload(),'GET')).statusCode,405);
  assert.equal((await invoke(payload())).statusCode,503);
  process.env.CLOUDFLARE_API_TOKEN='test-secret';process.env.CLOUDFLARE_ACCOUNT_ID='a'.repeat(32);
  let sent;
  globalThis.fetch=async(url,options)=>{assert.match(url,/api.cloudflare.com.*flux-1-schnell$/);sent=JSON.parse(options.body);assert.equal(options.headers.Authorization,'Bearer test-secret');return {ok:true,json:async()=>({success:true,result:{image:'dGVzdA=='}})}};
  for(const id of Object.keys(packages))for(let i=0;i<3;i++){assert.equal((await invoke(payload([],id,i))).statusCode,200);assert.equal(sent.steps,4);}
  const response=await invoke(payload([{id:'marquee'},{id:'tablecloth',quantity:3}]));
  assert.equal(response.data.image,'data:image/jpeg;base64,dGVzdA==');assert.match(sent.prompt,/exactly 3 tables/);assert.match(sent.prompt,/Clear ceiling/);
  await invoke(payload([{id:'cloud'}]));assert.match(sent.prompt,/Ceiling balloon installation visible/);
  for(const body of [payload([{id:'bad'}]),payload([{id:'tablecloth',quantity:0}]),payload([{id:'cloud'},{id:'cloud'}]),payload([],'sweet',55)]) assert.equal((await invoke(body)).statusCode,400);
  for(const [status,message,reason] of [[429,'daily neuron quota exceeded','daily_limit'],[401,'test-secret','connection_required'],[429,'busy','rate_limit'],[500,'internal sensitive text','upstream_error']]){
   globalThis.fetch=async()=>({ok:false,status,json:async()=>({success:false,errors:[{message}]})});const r=await invoke(payload());assert.equal(r.data.code,reason);assert.doesNotMatch(r.data.error,/test-secret|internal sensitive/);
  }
  globalThis.fetch=async()=>({ok:true,json:async()=>({success:true,result:{}})});assert.equal((await invoke(payload())).statusCode,502);
 }finally{globalThis.fetch=fetchBefore;for(const key of ['CLOUDFLARE_API_TOKEN','CLOUDFLARE_ACCOUNT_ID'])if(envBefore[key]===undefined)delete process.env[key];else process.env[key]=envBefore[key];}
});
