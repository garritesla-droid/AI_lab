import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const {calculate:c}=createRequire(import.meta.url)('../app.js');
const b=[{name:'АЗС',amount:10000,method:'card'}],o=[{rate:5,cap:1000,months:3,city:'Краснодар',method:'card'}];
test('city, duration and payment method affect calculation without double counting',()=>{
 assert.equal(c(60000,30000,100000,[1,1000,3,150,30000],b,o,'Краснодар').total,7800);
 assert.equal(c(60000,30000,100000,[1,1000,3,150,30000],b,o,'Москва').total,6600);
 assert.equal(c(60000,30000,100000,[1,1000,3,150,30000],[{...b[0],method:'sbp'}],o,'Краснодар').total,5400);
 assert.throws(()=>c(0,1,0,[0,0,0,0,0],b,o,'Москва'));
});
