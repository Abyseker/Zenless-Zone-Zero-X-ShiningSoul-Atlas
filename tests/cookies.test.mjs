import assert from 'node:assert/strict';
import fs from 'node:fs';
import {encodeCollection,decodeCollection,readCookie,cookieName} from '../app/cookie-storage.ts';
const cards=JSON.parse(fs.readFileSync(new URL('../app/data/cards.json',import.meta.url)));
const entries=Object.fromEntries(cards.map(c=>[c.id,{status:2,quantity:9999,updatedAt:123}]));
const value=encodeCollection(entries,cards);assert(value.length<3700);const restored=decodeCollection(value,cards);assert.equal(Object.keys(restored).length,178);for(const c of cards){assert.equal(restored[c.id].quantity,9999);assert.equal(restored[c.id].status,2);}
assert.deepEqual(decodeCollection(encodeCollection({},cards),cards),{});assert.equal(readCookie(`other=1; ${cookieName}=${value}; more=2`),value);
assert.throws(()=>decodeCollection(btoa('{"v":1,"c":[[0,2,0]]}'),cards));assert.throws(()=>decodeCollection(btoa('{"v":1,"c":[[0,1,1],[0,1,2]]}'),cards));
console.log(`Cookie roundtrip verified for 178 cards at 9999 copies each: ${value.length} bytes.`);
