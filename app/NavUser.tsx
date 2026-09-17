'use client'
import Link from 'next/link'
import {useEffect,useState} from 'react'
export default function NavUser(){
 const [user,setUser]=useState<string>('')
 useEffect(()=>{setUser(JSON.parse(localStorage.getItem('zhizao-user')||'null')?.account||'')},[])
 if(!user)return <><Link href="/login">登录</Link><div className="avatar">未</div></>
 const mask=user.includes('@')?user.replace(/(.{2}).+(@.+)/,'$1***$2'):user.replace(/(\d{3})\d{4}(\d{4})/,'$1****$2')
 return <><span className="nav-user">你好，{mask}</span><div className="avatar">{mask.slice(0,1)}</div><Link href="/" onClick={()=>{localStorage.removeItem('zhizao-user')}} className="nav-logout">退出</Link></>
}
