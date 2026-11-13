import test from 'node:test';
import assert from 'node:assert/strict';
import {parseSource,fetchSource,plain} from '../service/collector.mjs';
import {SOURCES} from '../service/sources.mjs';
const bcs=SOURCES.find(s=>s.id==='bcs');
test('partner section and bounded advertised rate do not create eligible benefit',()=>{
 const html='<h1>Предложения от партнеров БКС Банка</h1><div>Ашан Сеть магазинов Кешбэк до 14%</div><div>Лэтуаль Косметика Кешбэк 3,5%</div><h2>Как это работает</h2><p>'+ 'Подробные условия доступны клиенту. '.repeat(10)+'</p>';
 const r=parseSource(bcs,html);assert.equal(r.facts.find(f=>f.merchant==='Ашан').advertisedRate,'до 14%');assert.equal(r.facts.find(f=>f.merchant==='Лэтуаль').advertisedRate,'3,5%');assert.ok(r.facts.every(f=>!f.calculationEligible));assert.ok(r.excerpt.split(' ').length<=20);assert.equal(r.hash.length,64);
});
test('merchant mention outside partner section is not partnership',()=>{
 const r=parseSource(bcs,'<p>Wildberries</p><h2>Предложения от партнеров БКС</h2><p>Ашан</p><h2>Как это работает</h2>'+ 'Текст условий. '.repeat(20));
 assert.equal(r.facts.find(f=>f.merchant==='Wildberries').type,'mention');
});
test('challenge and changed markup fail closed',()=>assert.throws(()=>parseSource(bcs,'<html>Подтвердите что вы человек</html>')));
test('scripts are not evidence',()=>assert.equal(plain('<script>Ашан 99%</script><p>Текст &amp; текст</p>'),'Текст & текст'));
test('fetch errors remain unavailable, not zero offers',async()=>{
 const r=await fetchSource(bcs,async()=>new Response('blocked',{status:403}));assert.equal(r.status,'unavailable');assert.match(r.error,/403/);assert.equal(r.url,bcs.url);
});
test('unexpected non-HTML content rejected',async()=>{
 const r=await fetchSource(bcs,async()=>new Response('{}',{headers:{'content-type':'application/json'}}));assert.equal(r.status,'unavailable');
});
