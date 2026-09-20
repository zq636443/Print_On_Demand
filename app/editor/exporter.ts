'use client'
import {ensureGarment,loadSrc,drawGarment,drawLayers,PRINT_AREA,SRC_W,SRC_H} from './TshirtMockup'
import {mockupSvg,GARMENTS,type GarmentKind} from './garments'
import type {Layer} from './types'

function svgToImage(svg:string){
  return new Promise<HTMLImageElement>((res,rej)=>{
    const img=new Image()
    img.onload=()=>res(img)
    img.onerror=rej
    img.src=URL.createObjectURL(new Blob([svg],{type:'image/svg+xml'}))
  })
}

// 合成服装+设计的预览图，返回 dataURL（导出/发布共用）
export async function composePng(kind:GarmentKind,color:string,face:'front'|'back',layers:Layer[]):Promise<string>{
  await ensureGarment()
  await Promise.all(layers.filter(l=>l.src).map(l=>loadSrc(l.src as string)))
  const c=document.createElement('canvas')
  const scale=2
  const x=c.getContext('2d')
  if(!x)return ''
  let area
  if(kind==='tshirt'){
    c.width=SRC_W*scale;c.height=SRC_H*scale
    x.scale(scale,scale)
    drawGarment(x,color,false,face)
    area=PRINT_AREA
  }else{
    c.width=400*scale;c.height=440*scale
    x.scale(scale,scale)
    const img=await svgToImage(mockupSvg(kind,color,face,false))
    x.drawImage(img,0,0,400,440)
    area=GARMENTS[kind].areaVb
  }
  drawLayers(x,layers,area)
  return c.toDataURL('image/png')
}

export async function exportPng(kind:GarmentKind,color:string,face:'front'|'back',layers:Layer[]){
  const dataUrl=await composePng(kind,color,face,layers)
  const blob=await(await fetch(dataUrl)).blob()
  const a=document.createElement('a')
  a.href=URL.createObjectURL(blob)
  a.download='zhizao-product.png'
  a.click()
  setTimeout(()=>URL.revokeObjectURL(a.href),5000)
}
