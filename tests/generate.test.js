import test from 'node:test';
import assert from 'node:assert/strict';
import handler from '../api/generate.js';
import { packages } from '../catalog.js';

const payload = (addons=[], packageId='sweet', index=0) => ({package:{id:packageId},look:{index},addons});
async function invoke(body, method='POST') {
  const res={statusCode:200,status(n){this.statusCode=n;return this},json(data){this.data=data;return this}};
  await handler({method,body},res); return res;
}
test('endpoint selection, validation and error behavior', async()=>{
  const originalFetch=globalThis.fetch, originalKey=process.env.OPENAI_API_KEY;
  try {
    delete process.env.OPENAI_API_KEY;
    assert.equal((await invoke(payload(),'GET')).statusCode,405);
    assert.equal((await invoke(payload())).statusCode,500);
    process.env.OPENAI_API_KEY='test-placeholder';
    let sent;
    globalThis.fetch=async(url,options)=>{sent=JSON.parse(options.body);assert.equal(url,'https://api.openai.com/v1/images/generations');return {ok:true,json:async()=>({data:[{b64_json:'dGVzdA=='}]})}};
    for(const id of Object.keys(packages)) for(let index=0;index<3;index++) {
      const response=await invoke(payload([],id,index));
      assert.equal(response.statusCode,200);
      assert.match(sent.prompt,new RegExp(packages[id].name));
      assert.equal(sent.model,'gpt-image-2');
    }
    await invoke(payload([{id:'marquee'},{id:'tablecloth',quantity:3}]));
    assert.match(sent.prompt,/Marquee 16/);
    assert.match(sent.prompt,/quantity 3/);
    assert.match(sent.prompt,/DO NOT show[^\n]*Cloud Nine/);
    await invoke(payload([{id:'cloud'}]));
    assert.doesNotMatch(sent.prompt,/DO NOT show[^\n]*Cloud Nine/);
    await invoke(payload([],'extra',2));
    assert.match(sent.prompt,/clear ceiling, without suspended balloons/);
    for(const body of [payload([{id:'tablecloth',quantity:-1}]),payload([{id:'bad'}]),payload([{id:'cloud'},{id:'cloud'}]),payload([],'sweet',99)]) assert.equal((await invoke(body)).statusCode,400);
    globalThis.fetch=async()=>({ok:false,json:async()=>({error:{message:'sensitive upstream details'}})});
    const failed=await invoke(payload()); assert.equal(failed.statusCode,500);assert.doesNotMatch(failed.data.error,/sensitive/);
  } finally { globalThis.fetch=originalFetch;if(originalKey===undefined)delete process.env.OPENAI_API_KEY;else process.env.OPENAI_API_KEY=originalKey; }
});
