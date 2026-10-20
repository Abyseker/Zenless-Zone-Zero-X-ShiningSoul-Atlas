import {validEntry} from './model.ts';
import type {Entries,Card} from './model';
export const cookieName='zzz_shining_collection_v1';
// Catalog indexes belong to this immutable v1 catalog; append new cards instead of reordering.
export function encodeCollection(entries:Entries,cards:Card[]):string{
 const values=cards.flatMap((card,index)=>{const e=entries[card.id];return e&&validEntry(e)&&e.status!==0?[[index,e.status,e.quantity]]:[];});
 const value=btoa(JSON.stringify({v:1,c:values}));if(value.length>3700)throw new Error('记录超出Cookie容量，请导出备份');return value;
}
export function decodeCollection(value:string,cards:Card[]):Entries{
 const parsed=JSON.parse(atob(value));if(parsed.v!==1||!Array.isArray(parsed.c)||parsed.c.length>cards.length)throw new Error('Cookie记录格式无效');
 const out:Entries={};const seen=new Set<number>();for(const row of parsed.c){if(!Array.isArray(row)||row.length!==3)throw new Error('Cookie记录格式无效');const [index,status,quantity]=row;if(!Number.isInteger(index)||index<0||index>=cards.length||seen.has(index))throw new Error('Cookie卡牌索引无效');const entry={status,quantity,updatedAt:0};if(!validEntry(entry))throw new Error('Cookie份数无效');out[cards[index].id]=entry;seen.add(index);}return out;
}
export function readCookie(cookie:string):string|undefined{return cookie.split(';').map(x=>x.trim()).find(x=>x.startsWith(cookieName+'='))?.slice(cookieName.length+1);}
