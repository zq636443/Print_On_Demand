'use client'
import Link from 'next/link'
import {useRouter} from 'next/navigation'
import {useEffect,useState} from 'react'
export default function Login(){
 const [account,setAccount]=useState(''),[code,setCode]=useState(''),[count,setCount]=useState(0),[error,setError]=useState(''),[info,setInfo]=useState('')
 const router=useRouter()
 useEffect(()=>{if(count<=0)return;const t=setTimeout(()=>setCount(c=>c-1),1000);return()=>clearTimeout(t)},[count])
 function sendCode(){
  setError('');setInfo('')
  if(!/^1\d{10}$/.test(account)&&!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(account)){setError('请输入正确的手机号或邮箱');return}
  setCount(60);setInfo('验证码已发送（开发模式验证码：888888）')
 }
 function login(){
  setError('')
  if(!/^1\d{10}$/.test(account)&&!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(account)){setError('请输入正确的手机号或邮箱');return}
  if(code!=='888888'){setError('验证码不正确，开发模式请使用 888888');return}
  localStorage.setItem('zhizao-user',JSON.stringify({account,at:Date.now()}))
  router.push('/')
 }
 return <main className="shell"><header className="nav"><div className="brand"><i/>织造台</div><div className="spacer"/><Link href="/">返回首页</Link></header><section style={{maxWidth:420,margin:'90px auto',padding:'0 20px'}}><div className="eyebrow">WELCOME TO ZHIZAO</div><h1 style={{fontSize:36,margin:'14px 0 10px'}}>登录你的工作台</h1><p className="sub">让每一个设计，都有机会成为一件商品。</p><div className="card" style={{padding:26}}><label style={{fontSize:12,color:'#8a896e'}}>手机号或邮箱</label><input placeholder="输入手机号或邮箱" value={account} onChange={e=>{setAccount(e.target.value);setError('')}} style={{display:'block',width:'100%',padding:13,border:'1px solid #e3e2da',borderRadius:10,margin:'8px 0 16px'}}/><label style={{fontSize:12,color:'#8a896e'}}>验证码</label><div style={{display:'flex',gap:10,margin:'8px 0 16px'}}><input placeholder="6 位验证码" value={code} onChange={e=>{setCode(e.target.value);setError('')}} onKeyDown={e=>e.key==='Enter'&&login()} style={{flex:1,padding:13,border:'1px solid #e3e2da',borderRadius:10}}/><button className="primary" onClick={sendCode} disabled={count>0} style={{padding:'0 16px',whiteSpace:'nowrap',opacity:count>0?.6:1}}>{count>0?count+'s 后重发':'获取验证码'}</button></div>{error&&<div style={{color:'#c62828',fontSize:13,marginBottom:12}}>⚠ {error}</div>}{info&&<div style={{color:'#2e7d32',fontSize:13,marginBottom:12}}>{info}</div>}<button className="primary" style={{width:'100%'}} onClick={login}>登录 / 注册</button><div style={{textAlign:'center',marginTop:20,color:'#8a896e',fontSize:13}}>首次登录将自动创建账号，登录即代表同意用户协议与隐私政策</div></div></section></main>
}
