'use client'
import {useEffect,useState} from 'react'
import type {State} from './types'

type LibraryItem={id:string,src:string,at:string}
type TemplateItem={id:string,name:string,template:string,image:string,designState:State}

export function addToLibrary(src:string){
  const list:LibraryItem[]=JSON.parse(localStorage.getItem('zhizao-library')||'[]')
  localStorage.setItem('zhizao-library',JSON.stringify([{id:Date.now().toString(),src,at:new Date().toISOString()},...list].slice(0,30)))
}

export function AiPanel({onPick}:{onPick:(src:string)=>void}){
  const [items,setItems]=useState<string[]>([])
  useEffect(()=>{setItems([gen(),gen(),gen(),gen()])},[])
  return <><p className="drawer-tip">AI 灵感生成（本地程序化图案，点击添加到画布）</p><div className="drawer-grid">{items.map((s,i)=><button key={i} className="drawer-item" onClick={()=>onPick(s)}><img src={s} alt="AI 图案"/></button>)}</div><button className="drawer-action" onClick={()=>setItems([gen(),gen(),gen(),gen()])}>↻ 换一批</button></>
}

const PALETTES=[['#e23057','#f5b301','#1d6fd1','#262a33'],['#2e9e63','#f5f3dc','#e23057','#202431'],['#1d6fd1','#f5b301','#2e9e63','#ffffff'],['#f43f5e','#4d69f6','#f5b301','#202431']]
function gen(){
  const c=document.createElement('canvas');c.width=c.height=300
  const x=c.getContext('2d')!
  const pal=PALETTES[Math.floor(Math.random()*PALETTES.length)]
  const bg=pal[Math.floor(Math.random()*pal.length)]
  x.fillStyle=bg;x.fillRect(0,0,300,300)
  const kind=Math.floor(Math.random()*3)
  if(kind===0){for(let i=0;i<7;i++){x.fillStyle=pal[Math.floor(Math.random()*pal.length)];x.globalAlpha=.75;x.beginPath();x.arc(40+Math.random()*220,40+Math.random()*220,20+Math.random()*55,0,Math.PI*2);x.fill()}}
  else if(kind===1){for(let i=0;i<9;i++){x.strokeStyle=pal[Math.floor(Math.random()*pal.length)];x.lineWidth=5+Math.random()*16;x.globalAlpha=.8;x.beginPath();const y=Math.random()*300;x.moveTo(-20,y);x.bezierCurveTo(100,y-60+Math.random()*120,200,y-60+Math.random()*120,320,y+Math.random()*60);x.stroke()}}
  else{for(let i=0;i<5;i++){x.fillStyle=pal[Math.floor(Math.random()*pal.length)];x.globalAlpha=.8;const w=30+Math.random()*90,h=30+Math.random()*90;x.save();x.translate(150,150);x.rotate(Math.random()*Math.PI);x.fillRect(-w/2+(Math.random()-.5)*140,-h/2+(Math.random()-.5)*140,w,h);x.restore()}}
  x.globalAlpha=1
  return c.toDataURL('image/png')
}

const SHAPES=[
  {name:'星星',svg:'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100"><path d="M50 4 61 38 97 38 68 59 79 94 50 72 21 94 32 59 3 38 39 38Z" fill="#f5b301"/></svg>'},
  {name:'爱心',svg:'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100"><path d="M50 88C20 66 6 48 6 32 6 18 17 8 30 8c9 0 16 5 20 12 4-7 11-12 20-12 13 0 24 10 24 24 0 16-14 34-44 56Z" fill="#e23057"/></svg>'},
  {name:'闪电',svg:'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100"><path d="M56 4 16 56h26L38 96 84 42H56Z" fill="#f5b301"/></svg>'},
  {name:'圆环',svg:'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100"><circle cx="50" cy="50" r="38" fill="none" stroke="#1d6fd1" stroke-width="14"/></svg>'},
  {name:'三角',svg:'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100"><path d="M50 10 92 86H8Z" fill="#2e9e63"/></svg>'},
  {name:'花朵',svg:'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100"><g fill="#e23057"><circle cx="50" cy="22" r="18"/><circle cx="76" cy="41" r="18"/><circle cx="66" cy="71" r="18"/><circle cx="34" cy="71" r="18"/><circle cx="24" cy="41" r="18"/></g><circle cx="50" cy="48" r="14" fill="#f5b301"/></svg>'},
]
export function GraphicsPanel({onPick}:{onPick:(src:string)=>void}){
  return <><p className="drawer-tip">内置图形，点击添加到画布</p><div className="drawer-grid">{SHAPES.map(s=><button key={s.name} className="drawer-item" onClick={()=>onPick('data:image/svg+xml;utf8,'+encodeURIComponent(s.svg))}><span dangerouslySetInnerHTML={{__html:s.svg}}/><small>{s.name}</small></button>)}</div></>
}

export function LibraryPanel({onPick}:{onPick:(src:string)=>void}){
  const [items,setItems]=useState<LibraryItem[]>([])
  useEffect(()=>{setItems(JSON.parse(localStorage.getItem('zhizao-library')||'[]'))},[])
  if(items.length===0)return <p className="drawer-tip">素材库还是空的<br/><small>上传过的图片会自动保存在这里</small></p>
  return <><p className="drawer-tip">我的素材（上传时自动收录）</p><div className="drawer-grid">{items.map(it=><button key={it.id} className="drawer-item" onClick={()=>onPick(it.src)}><img src={it.src} alt="素材"/></button>)}</div></>
}

export function TemplatesPanel({onApply}:{onApply:(t:TemplateItem)=>void}){
  const [items,setItems]=useState<TemplateItem[]>([])
  useEffect(()=>{const list=JSON.parse(localStorage.getItem('zhizao-products')||'[]');setItems(list.filter((p:TemplateItem)=>p.designState&&p.designState.front&&p.designState.back))},[])
  if(items.length===0)return <p className="drawer-tip">还没有保存过的模板<br/><small>点击顶部「Save as template」保存当前设计</small></p>
  return <><p className="drawer-tip">我的模板（点击应用设计）</p><div className="drawer-list">{items.map(t=><button key={t.id} className="drawer-row" onClick={()=>onApply(t)}><span className="row-thumb">{t.image?<img src={t.image} alt=""/>:t.template.slice(0,1)}</span><span className="row-text"><b>{t.name}</b><small>{t.template}</small></span></button>)}</div></>
}
