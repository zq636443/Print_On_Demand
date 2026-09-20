'use client'
import Link from 'next/link'
import {useEffect,useState} from 'react'
import NavUser from '../NavUser'
import {composePng} from '../editor/exporter'
import {TEMPLATE_KIND,type GarmentKind} from '../editor/garments'
import type {State} from '../editor/types'

type ChannelAccount={id:string,platform:'xiaohongshu',name:string,appKey:string,appSecret:string,storeId:string,accessToken?:string,boundAt:string}
type Product={id:string,name:string,template:string,image:string,status:string,updated:string,designState?:State,sizes?:string[],price?:number}
type ChannelProduct={platformProductId:string,itemId?:string,status:'同步中'|'已同步'|'失败',error?:string,updatedAt:string}
type OrderRow={orderId:string,status?:string,sku?:string,qty?:number,expressTrackingNo?:string,expressCompanyCode?:string}

const COLOR_NAMES:Record<string,string>={'#f5f5f1':'白色','#92949b':'灰色','#202431':'黑色','#d9c7a7':'米杏','#7a8b6f':'军绿','#e23057':'红色','#1d6fd1':'蓝色'}

export default function Channels(){
  const [account,setAccount]=useState<ChannelAccount|null>(null)
  const [form,setForm]=useState({name:'',appKey:'',appSecret:'',storeId:'',accessToken:''})
  const [products,setProducts]=useState<Product[]>([])
  const [pubs,setPubs]=useState<Record<string,ChannelProduct>>({})
  const [pingResult,setPingResult]=useState('')
  const [busy,setBusy]=useState(false)
  const [orders,setOrders]=useState<OrderRow[]>([])
  const [ordersMsg,setOrdersMsg]=useState('')
  useEffect(()=>{
    const acc=JSON.parse(localStorage.getItem('zhizao-channel-account')||'null')
    if(acc)setAccount(acc)
    setProducts(JSON.parse(localStorage.getItem('zhizao-products')||'[]'))
    setPubs(JSON.parse(localStorage.getItem('zhizao-channel-products')||'{}'))
  },[])
  function saveAccount(a:ChannelAccount|null){setAccount(a);a?localStorage.setItem('zhizao-channel-account',JSON.stringify(a)):localStorage.removeItem('zhizao-channel-account')}
  function savePubs(next:Record<string,ChannelProduct>){setPubs(next);localStorage.setItem('zhizao-channel-products',JSON.stringify(next))}
  function bind(){
    if(!form.name.trim()||!form.appKey.trim()||!form.appSecret.trim()){setPingResult('请填写店铺名称、App Key 和 App Secret');return}
    saveAccount({id:Date.now().toString(),platform:'xiaohongshu',name:form.name.trim(),appKey:form.appKey.trim(),appSecret:form.appSecret.trim(),storeId:form.storeId.trim(),accessToken:form.accessToken.trim()||undefined,boundAt:new Date().toISOString()})
    setPingResult('')
  }
  async function testPing(){
    if(!account)return
    setBusy(true);setPingResult('测试中…')
    try{
      const r=await fetch('/api/xhs',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'ping',account:{appKey:account.appKey,appSecret:account.appSecret,accessToken:account.accessToken}})})
      const j=await r.json()
      setPingResult(j.ok?('连通成功，HTTP '+j.http+'：'+JSON.stringify(j.result).slice(0,400)):('失败：'+j.error))
    }catch(e){setPingResult('请求失败：'+e)}
    setBusy(false)
  }
  async function publish(p:Product){
    if(!account)return
    savePubs({...pubs,[p.id]:{platformProductId:p.id,status:'同步中',updatedAt:new Date().toISOString()}})
    try{
      const kind:GarmentKind=TEMPLATE_KIND[p.template]||'tshirt'
      const ds=p.designState
      let imageBase64=''
      if(ds)imageBase64=(await composePng(kind,ds.front.color,'front',ds.front.layers)).split(',')[1]
      const colorName=ds?COLOR_NAMES[ds.front.color]||ds.front.color:'默认'
      const specs=[{name:'颜色',values:[colorName]},{name:'尺码',values:p.sizes?.length?p.sizes:['均码']}]
      const r=await fetch('/api/xhs',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'publish',account:{appKey:account.appKey,appSecret:account.appSecret,accessToken:account.accessToken},payload:{name:p.name,price:p.price||99,stock:999,specs,imageBase64,outItemId:p.id}})})
      const j=await r.json()
      if(!j.ok){savePubs({...pubs,[p.id]:{platformProductId:p.id,status:'失败',error:j.error,updatedAt:new Date().toISOString()}});return}
      const res=j.result||{}
      const err=res.error_code??res.code??(res.success?0:1)
      if(err===0||res.success===true){
        const data=res.data||{}
        const itemId=data.itemId||data.item_id||(data.items&&data.items[0]&&data.items[0].id)||''
        savePubs({...pubs,[p.id]:{platformProductId:p.id,itemId,status:'已同步',updatedAt:new Date().toISOString()}})
      }else{
        savePubs({...pubs,[p.id]:{platformProductId:p.id,status:'失败',error:(res.error_msg||res.msg||JSON.stringify(res)).slice(0,300),updatedAt:new Date().toISOString()}})
      }
    }catch(e){savePubs({...pubs,[p.id]:{platformProductId:p.id,status:'失败',error:String(e),updatedAt:new Date().toISOString()}})}
  }
  async function loadOrders(){
    if(!account)return
    setBusy(true);setOrdersMsg('拉取中…')
    try{
      const r=await fetch('/api/xhs',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'orders',account:{appKey:account.appKey,appSecret:account.appSecret,accessToken:account.accessToken},payload:{pageNo:1,pageSize:20}})})
      const j=await r.json()
      const res=j.result||{}
      const data=res.data||{}
      const list=(data.orderList||data.orders||[]) as Record<string,unknown>[]
      setOrders(list.map(o=>({orderId:String(o.orderId||o.order_id||o.id),status:String(o.orderStatus||o.status||''),sku:String(o.skuId||''),qty:Number(o.quantity||o.qty||1)})))
      setOrdersMsg(j.ok?`共 ${list.length} 单（HTTP ${j.http}）`:'失败：'+j.error)
    }catch(e){setOrdersMsg('请求失败：'+e)}
    setBusy(false)
  }
  async function ship(o:OrderRow){
    if(!account||!o.expressTrackingNo||!o.expressCompanyCode)return
    setOrdersMsg('回填中…')
    const r=await fetch('/api/xhs',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'ship',account:{appKey:account.appKey,appSecret:account.appSecret,accessToken:account.accessToken},payload:{orderId:o.orderId,expressCompanyCode:o.expressCompanyCode,expressTrackingNo:o.expressTrackingNo}})})
    const j=await r.json()
    setOrdersMsg(j.ok?('回填结果：'+JSON.stringify(j.result).slice(0,200)):('失败：'+j.error))
  }
  return <main className="shell"><header className="nav"><div className="brand"><i/>织造台</div><Link href="/">首页</Link><Link href="/">模板库</Link><Link href="/products">我的产品</Link><Link className="active" href="/channels">渠道管理</Link><div className="spacer"/><NavUser/></header><section className="workspace"><h1>渠道管理</h1><p className="sub">绑定小红书店铺，把创作的产品一键铺货上架，订单同步与运单回填</p>
  <div className="chan-card"><h3>店铺授权</h3>
    {!account?<div className="bind-form">
      <div className="form-row"><label>店铺名称（备注）</label><input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="例如：织造台官方店"/></div>
      <div className="form-row"><label>App Key</label><input value={form.appKey} onChange={e=>setForm({...form,appKey:e.target.value})} placeholder="开放平台应用 AppKey"/></div>
      <div className="form-row"><label>App Secret</label><input value={form.appSecret} onChange={e=>setForm({...form,appSecret:e.target.value})} placeholder="开放平台应用 AppSecret"/></div>
      <div className="form-row"><label>店铺 ID</label><input value={form.storeId} onChange={e=>setForm({...form,storeId:e.target.value})} placeholder="小红书店铺 ID"/></div>
      <div className="form-row"><label>AccessToken（可选）</label><input value={form.accessToken} onChange={e=>setForm({...form,accessToken:e.target.value})} placeholder="部分接口需要"/></div>
      <button className="primary" onClick={bind}>绑定店铺</button>
    </div>:<div className="acc-row">
      <div className="acc-info"><b>{account.name}</b><small>店铺 ID：{account.storeId||'未填'} · 绑定于 {account.boundAt.slice(0,10)}</small></div>
      <button className="edit-btn" onClick={testPing} disabled={busy}>测试连接</button>
      <button className="edit-btn" onClick={()=>saveAccount(null)}>解除绑定</button>
    </div>}
    {pingResult&&<p className="chan-msg">{pingResult}</p>}
  </div>
  {account&&<><div className="chan-card"><h3>产品铺货</h3><p className="muted">将创作好的产品生成 SKU 并上架到绑定店铺（预览图自动合成并上传素材中心）</p>
    {products.length===0?<div className="empty">还没有产品<br/><small>先去模板库创作一个商品</small></div>:<div className="pub-list">{products.map(p=>{const cp=pubs[p.id];return <div className="pub-row" key={p.id}><div className="row-thumb">{p.image?<img src={p.image} alt=""/>:p.template.slice(0,1)}</div><div className="pub-info"><b>{p.name}</b><small>{p.template} · {p.updated}</small></div><span className={'pub-status '+(cp?.status==='已同步'?'ok':cp?.status==='失败'?'err':cp?.status==='同步中'?'ing':'')}>{cp?cp.status+(cp.itemId?' · '+cp.itemId:''):'未同步'}</span>{cp?.error&&<small className="pub-err">{cp.error}</small>}<button className="edit-btn" onClick={()=>publish(p)} disabled={cp?.status==='同步中'}>发布到小红书</button></div>})}</div>}
  </div>
  <div className="chan-card"><h3>订单同步与发货回填</h3>
    <div className="acc-row"><p className="muted" style={{margin:0}}>从店铺拉取待发货订单，厂家发货后回填运单号</p><button className="edit-btn" onClick={loadOrders} disabled={busy}>拉取订单</button></div>
    {ordersMsg&&<p className="chan-msg">{ordersMsg}</p>}
    {orders.length>0&&<div className="pub-list">{orders.map((o,i)=><div className="pub-row" key={o.orderId||i}><div className="pub-info"><b>订单 {o.orderId}</b><small>{o.status}{o.sku&&' · SKU '+o.sku}{' · 数量 '+o.qty}</small></div><input className="ship-input" placeholder="快递公司代码" value={o.expressCompanyCode||''} onChange={e=>setOrders(orders.map((x,j)=>j===i?{...x,expressCompanyCode:e.target.value}:x))}/><input className="ship-input" placeholder="运单号" value={o.expressTrackingNo||''} onChange={e=>setOrders(orders.map((x,j)=>j===i?{...x,expressTrackingNo:e.target.value}:x))}/><button className="edit-btn" onClick={()=>ship(o)}>回填运单</button></div>)}</div>}
  </div></>}
  </section></main>
}
