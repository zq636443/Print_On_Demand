'use client'
import {useEffect,useRef} from 'react'
import {mockupSvg,type GarmentKind} from './garments'

export default function GarmentSvg({kind,color,face,edit}:{kind:GarmentKind,color:string,face:'front'|'back',edit:boolean}){
  const ref=useRef<HTMLDivElement>(null)
  useEffect(()=>{if(ref.current)ref.current.innerHTML=mockupSvg(kind,color,face,edit)},[kind,color,face,edit])
  return <div ref={ref} className="garment-svg" aria-label="商品预览"/>
}
