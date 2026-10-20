'use client';
import {useEffect,useMemo,useRef,useState} from 'react';
import type {CSSProperties,PointerEvent as ReactPointerEvent} from 'react';
import cardData from './data/cards.json';
import {categories,cycle,empty,groupCards,statusNames,validEntry,withQuantity} from './model';
import type {Card,Entries,Entry} from './model';
import {cookieName,encodeCollection,decodeCollection,readCookie} from './cookie-storage';
const cards=(cardData as Card[]).map(c=>({...c,image:'.'+c.image}));
const ids=new Set(cards.map(c=>c.id));
const modes=[['rarity','稀有度'],['agent','角色'],['faction','阵营']];
function Tile({card,entry,change,edit}:{card:Card;entry:Entry;change:()=>void;edit:()=>void}){
 const timer=useRef<ReturnType<typeof setTimeout>|null>(null),start=useRef({x:0,y:0}),held=useRef(false);
 const clear=()=>{if(timer.current)clearTimeout(timer.current);timer.current=null;};
 useEffect(()=>clear,[]);
 function down(e:ReactPointerEvent){if(e.button!==0)return;clear();held.current=false;start.current={x:e.clientX,y:e.clientY};timer.current=setTimeout(()=>{held.current=true;edit();},550);}
 function move(e:ReactPointerEvent){if(Math.hypot(e.clientX-start.current.x,e.clientY-start.current.y)>10){clear();held.current=true;}}
 const landscape=card.width>card.height;
 return <div className={'tile state-'+entry.status} data-card={card.id} style={{'--ratio':`${card.width}/${card.height}`} as CSSProperties}>
  <button className="face" type="button" aria-label={`${card.code||'卡号待核实'} ${card.name}，${statusNames[entry.status]}，${entry.quantity}份；点击切换，长按编辑份数`} title={`${card.code||'卡号待核实'} · ${card.name}`} onPointerDown={down} onPointerMove={move} onPointerUp={clear} onPointerCancel={()=>{clear();held.current=true;}} onContextMenu={e=>e.preventDefault()} onClick={()=>{if(held.current){held.current=false;return;}change();}} onKeyDown={e=>{if(e.key==='F2'){e.preventDefault();edit();}}}>
   <img src={card.image} alt={card.name} width={card.width} height={card.height} loading="lazy" draggable={false}/>
   {landscape&&<span className="source-corner" aria-hidden="true"/>}
   {entry.status===2&&<span className="check" aria-hidden="true">✓</span>}
  </button>
  <button className="quantity" type="button" aria-label={`${card.name}：修改份数，当前${entry.quantity}份`} onClick={edit}>{entry.quantity}</button>
 </div>;
}
export default function Album(){
 const [entries,setEntries]=useState<Entries>({}),[mode,setMode]=useState('rarity'),[selected,setSelected]=useState('全部'),[section,setSection]=useState('main'),[sync,setSync]=useState('正在读取'),[menu,setMenu]=useState(false),[help,setHelp]=useState(false),[editing,setEditing]=useState<Card|null>(null),[quantity,setQuantity]=useState('1'),[error,setError]=useState(''),[ready,setReady]=useState(false),[notice,setNotice]=useState('');
 const current=useRef<Entries>({}),dialog=useRef<HTMLDialogElement>(null),file=useRef<HTMLInputElement>(null),input=useRef<HTMLInputElement>(null),lastTime=useRef(0);
 const storeKey='zzz-midsummer-cookie-backup-v1';
 function persist(){
  let cookieSaved=false,backupSaved=false;
  try{const value=encodeCollection(current.current,cards);document.cookie=`${cookieName}=${value}; Max-Age=31536000; Path=${new URL('.',location.href).pathname}; SameSite=Lax${location.protocol==='https:'?'; Secure':''}`;cookieSaved=readCookie(document.cookie)===value;}catch{}
  try{localStorage.setItem(storeKey,JSON.stringify(current.current));backupSaved=true;}catch{}
  setSync(cookieSaved?'已保存到Cookie':backupSaved?'Cookie不可用，已存本机备份':'保存失败，请立即导出备份');
 }
 function refresh(){
  try{const value=readCookie(document.cookie);if(value){current.current=decodeCollection(value,cards);setEntries({...current.current});setSync('已保存到Cookie');return;}}catch{setNotice('Cookie记录无法读取，已尝试恢复本机备份');}
  try{const saved=JSON.parse(localStorage.getItem(storeKey)||'{}');const checked:Entries={};for(const [id,v]of Object.entries(saved))if(ids.has(id)&&validEntry(v))checked[id]=v;current.current=checked;setEntries({...checked});}catch{current.current={};setEntries({});}
  setSync('记录保存在当前浏览器');
 }
 useEffect(()=>{refresh();setReady(true);const update=()=>refresh();window.addEventListener('focus',update);window.addEventListener('storage',update);return()=>{window.removeEventListener('focus',update);window.removeEventListener('storage',update);};},[]);
 useEffect(()=>{if(editing){dialog.current?.showModal();requestAnimationFrame(()=>{input.current?.focus();input.current?.select();});}},[editing]);
 function now(){const next=Math.max(Date.now(),lastTime.current+1,...Object.values(current.current).map(e=>e.updatedAt+1));lastTime.current=next;return next;}
 function commit(id:string,value:Entry){current.current={...current.current,[id]:value};setEntries({...current.current});persist();}
 function change(card:Card){if(!ready)return;commit(card.id,cycle(current.current[card.id]||empty,now()));}
 function edit(card:Card){if(!ready)return;setError('');setQuantity(String((current.current[card.id]||empty).quantity));setEditing(card);}
 function close(){dialog.current?.close();setEditing(null);setError('');}
 function saveQuantity(){if(!editing)return;try{if(!/^\d+$/.test(quantity))throw new Error('请输入0至9999的整数');commit(editing.id,withQuantity(current.current[editing.id]||empty,Number(quantity),now()));close();}catch(e){setError((e as Error).message);}}
 const visible=useMemo(()=>cards.filter(c=>section==='all'||c.section===section),[section]);
 const options=useMemo(()=>[...new Set(visible.flatMap(c=>categories(c,mode)))],[visible,mode]);
 const grouped=useMemo(()=>groupCards(visible,mode,selected),[visible,mode,selected]);
 function exportRecords(){const blob=new Blob([JSON.stringify({format:'zzz-midsummer-collection',version:1,exportedAt:new Date().toISOString(),entries:current.current},null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=`仲夏欢梦收集记录-${new Date().toISOString().slice(0,10)}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);setMenu(false);}
 async function importRecords(f:File){try{const payload=JSON.parse(await f.text());if(payload.format!=='zzz-midsummer-collection'||payload.version!==1||!payload.entries||Array.isArray(payload.entries))throw new Error('不是本图鉴的记录备份');const values=Object.entries(payload.entries);if(values.length>cards.length)throw new Error('备份记录过多');for(const [id,e]of values)if(!ids.has(id)||!validEntry(e))throw new Error('备份含无效卡牌或数量，未导入');for(const [id,e]of values){const next={...(e as Entry),updatedAt:now()};current.current[id]=next;}setEntries({...current.current});persist();setNotice(`已导入${values.length}条记录`);}catch(e){setNotice((e as Error).message);}setMenu(false);if(file.current)file.current.value='';}
 return <main>
  <header className="bar"><div className="brand">绝区零X闪魂图鉴<span>仲夏欢梦 · 第二弹</span></div><div className="bar-actions"><button className={'sync '+(sync==='已保存到Cookie'||sync==='记录保存在当前浏览器'?'saved':'')} aria-label={sync} title={sync} onClick={()=>refresh()}><span/></button><button className="more" aria-label="记录与说明" aria-expanded={menu} onClick={()=>setMenu(!menu)}>···</button>{menu&&<div className="menu"><button onClick={exportRecords}>导出记录</button><button onClick={()=>file.current?.click()}>导入记录</button><button onClick={()=>{setHelp(true);setMenu(false);}}>使用与来源</button><small>{sync}</small></div>}</div></header>
  <nav className="classification" aria-label="分类方式">{modes.map(([id,name])=><button key={id} aria-pressed={mode===id} className={mode===id?'active':''} onClick={()=>{setMode(id);setSelected('全部');}}>{name}</button>)}<div className="scope"><select aria-label="卡牌范围" value={section} onChange={e=>{setSection(e.target.value);setSelected('全部');}}><option value="main">主系列 · 164</option><option value="bonus">活动与赠品 · 14</option><option value="all">全部 · 178</option></select></div></nav>
  <nav className="filters" aria-label="单项分类筛选">{['全部',...options].map(value=><button key={value} className={selected===value?'selected':''} aria-pressed={selected===value} onClick={()=>setSelected(value)}>{value}</button>)}</nav>
  <div className="catalog" aria-busy={!ready}>{grouped.map(([name,items])=><section className="group" key={name} aria-label={`${name}，${items.length}张卡`}><h2>{name}<span>{items.length}</span></h2><div className="card-grid">{items.map(card=><Tile key={card.id} card={card} entry={entries[card.id]||empty} change={()=>change(card)} edit={()=>edit(card)}/>)}</div></section>)}</div>
  <input ref={file} type="file" accept=".json,application/json" hidden onChange={e=>{if(e.target.files?.[0])importRecords(e.target.files[0]);}}/>
  <p className="sr-only" aria-live="polite">{sync}</p>{notice&&<div className="toast" role="status">{notice}<button onClick={()=>setNotice('')} aria-label="关闭提示">×</button></div>}
  <dialog ref={dialog} className="quantity-dialog" onCancel={e=>{e.preventDefault();close();}} onClick={e=>{if(e.target===e.currentTarget)close();}} aria-labelledby="quantity-title"><form onSubmit={e=>{e.preventDefault();saveQuantity();}}><h2 id="quantity-title">这张卡有几份？</h2><p>{editing?.code||'卡号待核实'} · {editing?.name}</p><input ref={input} aria-label="份数" type="number" inputMode="numeric" min="0" max="9999" step="1" value={quantity} onChange={e=>{setQuantity(e.target.value);setError('');}}/><small>填 0 标为未收集；从未收集填写正数后标为已收集。</small>{error&&<p className="error" role="alert">{error}</p>}<div className="dialog-actions"><button type="button" onClick={close}>取消</button><button className="primary" type="submit">保存</button></div></form></dialog>
  {help&&<div className="help-overlay" onClick={e=>{if(e.currentTarget===e.target)setHelp(false);}}><section className="help" role="dialog" aria-modal="true" aria-labelledby="help-title"><button className="close" aria-label="关闭说明" onClick={()=>setHelp(false)}>×</button><h2 id="help-title">使用与来源</h2><p>点击卡面：灰色未收集 → 原色已收集 → 勾选已入库。回到未收集时份数归零；进入持有状态至少为1份。</p><p>长按卡面约半秒、点击左上角数字，或聚焦卡面后按 F2，均可修改份数。已填写的份数会在两种持有状态间保留。</p><p>角色和阵营按行分组。选择上方某个名字可只显示该分类。多角色卡可出现于多行，状态与份数共用一条记录。</p><p>记录直接存入当前浏览器的第一方Cookie，并保留本机备份，有效期一年、每次修改续期。不同浏览器分别记录，不需要注册。换设备或清理浏览器数据前，可先导出备份后导入。绿色指示表示已保存。</p><p>164款主系列及14款活动/赠品，卡面、顺序和名称来自你提供的12张图鉴截图。截图灰白遮罩保留，已收集时显示截图原始色彩。人物标签含人工识图及部分配角，可见名称未补写。</p><p>图5三张隐藏邦布的卡号标签被截断；ER-209、R-206、R-214的完整名称仍待核实。截图来源未独立核实为官方小程序。</p><p><a href="https://www.bilibili.com/opus/1230057021348249616" target="_blank" rel="noreferrer">官方卡种与数量</a> · <a href="https://zzz.mihoyo.com/main?page=world" target="_blank" rel="noreferrer">官网角色与阵营</a></p><small>卡面版权 ©miHoYo ©SHININGSOUL。本页私人收藏记录使用。</small></section></div>}
 </main>;
}

