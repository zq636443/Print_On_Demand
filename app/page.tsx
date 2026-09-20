'use client'
import Link from 'next/link'
import {useRouter} from 'next/navigation'
import {useState} from 'react'
import NavUser from './NavUser'
import {mockupSvg,type GarmentKind} from './editor/garments'
type Item={title:string,desc:string,price:string,kind:GarmentKind,color:string,cat:'服装'|'家居'}
const ITEMS:Item[]=[
 {title:'圆领卫衣',desc:'经典版型，适合日常系列',price:'¥35 起',kind:'crew',color:'#92949b',cat:'服装'},
 {title:'连帽卫衣',desc:'更有层次感的秋冬主角',price:'¥49 起',kind:'hoodie',color:'#202431',cat:'服装'},
 {title:'短袖 T 恤',desc:'轻盈、好卖、适合快速上新',price:'¥22 起',kind:'tshirt',color:'#f5f5f1',cat:'服装'},
 {title:'马克杯',desc:'把你的图案放进每个清晨',price:'¥18 起',kind:'mug',color:'#f5f5f1',cat:'家居'},
]
const CHIPS=['全部','服装','家居','热卖推荐'] as const
export default function Home(){
 const [q,setQ]=useState(''),[chip,setChip]=useState<(typeof CHIPS)[number]>('全部')
 const router=useRouter()
 const filtered=ITEMS.filter(it=>{const okChip=chip==='全部'||(chip==='热卖推荐'?true:it.cat===chip);const okQ=!q||it.title.includes(q)||it.desc.includes(q);return okChip&&okQ})
 const start=()=>{const t=filtered[0];if(t)router.push('/editor?template='+encodeURIComponent(t.title))}
 return <main className="shell"><header className="nav"><div className="brand"><i/>织造台</div><Link href="/">首页</Link><Link href="/#templates">模板库</Link><Link href="/products">我的产品</Link><Link href="/channels">渠道管理</Link><div className="spacer"/><NavUser/></header><section className="hero"><div className="eyebrow">CREATE · PUBLISH · FULFILL</div><h1>把一个灵感，<span>做成一件商品</span></h1><p>从设计到铺货，再到工厂生产。你的创意，值得被看见。</p><div className="search"><span>⌕</span><input placeholder="搜索商品模板，例如：卫衣、马克杯" value={q} onChange={e=>setQ(e.target.value)} onKeyDown={e=>e.key==='Enter'&&start()}/><button className="primary" onClick={start}>开始创作</button></div></section><section className="content" id="templates"><div className="section-head"><div><h2>选择一个商品开始</h2><small>为你的下一次上新，挑一个合适的载体</small></div><small>共 {filtered.length} 个模板</small></div><div className="chips">{CHIPS.map(c=><button key={c} className={chip===c?'chip on':'chip'} onClick={()=>setChip(c)}>{c}</button>)}</div>{filtered.length===0?<div className="empty">没有找到匹配的模板<br/><small>换个关键词试试，例如「卫衣」「杯子」</small></div>:<div className="grid">{filtered.map(it=><article className="card" key={it.title}><div className="thumb thumb-svg" dangerouslySetInnerHTML={{__html:mockupSvg(it.kind,it.color,'front',false)}}/><div className="card-body"><div className="card-title">{it.title}</div><div className="meta"><span>{it.desc}</span><b>{it.price}</b></div><Link href={'/editor?template='+encodeURIComponent(it.title)}><button className="edit-btn">开始设计 →</button></Link></div></article>)}</div>}</section></main>
}
