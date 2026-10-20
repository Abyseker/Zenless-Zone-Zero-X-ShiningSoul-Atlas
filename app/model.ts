export type Entry={status:0|1|2;quantity:number;updatedAt:number};
export type Entries=Record<string,Entry>;
export type Card={id:string;order:number;section:string;rarity:string;kind:string;code:string;name:string;agents:string[];factions:string[];image:string;width:number;height:number;source:string;note:string};
export const empty:Entry={status:0,quantity:0,updatedAt:0};
export const statusNames=['未收集','已收集','已入库'];
export function cycle(entry:Entry,at:number):Entry {const status=((entry.status+1)%3) as Entry['status'];return{status,quantity:status===0?0:Math.max(1,entry.quantity),updatedAt:at};}
export function withQuantity(entry:Entry,quantity:number,at:number):Entry {
 if(!Number.isInteger(quantity)||quantity<0||quantity>9999)throw new Error('份数需为0至9999的整数');
 return{status:quantity===0?0:entry.status===0?1:entry.status,quantity,updatedAt:at};
}
export function validEntry(v:unknown):v is Entry{const e=v as Entry;return !!e&&[0,1,2].includes(e.status)&&Number.isInteger(e.quantity)&&e.quantity>=0&&e.quantity<=9999&&Number.isSafeInteger(e.updatedAt)&&e.updatedAt>=0&&(e.status===0?e.quantity===0:e.quantity>=1);}
export function categories(card:Card,mode:string):string[]{return mode==='rarity'?[card.rarity]:mode==='agent'?card.agents.map(x=>x==='不适用'?'非代理人':x):card.factions.map(x=>x==='不适用'?'非代理人':x);}
export function groupCards(cards:Card[],mode:string,selected:string){const groups=new Map<string,Card[]>();for(const card of cards)for(const key of categories(card,mode)){if(selected!=='全部'&&key!==selected)continue;if(!groups.has(key))groups.set(key,[]);groups.get(key)!.push(card);}return [...groups.entries()];}
