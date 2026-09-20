'use client'
import {useEffect,useRef} from 'react'
import type {Layer} from './types'

export const SRC_W=1062,SRC_H=926
export const PRINT_AREA={x:319,y:218,w:425,h:481}
export const LAYERS={
  base:'/mockups/tshirt/layers/base.png',
  shadow:'/mockups/tshirt/layers/shadow.png',
  highlight:'/mockups/tshirt/layers/highlight.png',
  seams:'/mockups/tshirt/layers/seams-nobox.png',
  mask:'/mockups/tshirt/layers/collar-mask.png',
}

const cache:Record<string,HTMLImageElement>={}
function getImage(src:string,onReady?:()=>void){
  const hit=cache[src]
  if(hit){if(onReady&&(hit.complete&&hit.naturalWidth))onReady();else if(onReady)hit.onload=onReady;return hit}
  const img=new Image()
  if(onReady)img.onload=onReady
  img.src=src
  cache[src]=img
  return img
}
export function ensureGarment(){return Promise.all(Object.values(LAYERS).map(src=>new Promise<void>(res=>{const img=getImage(src);if(img.complete&&img.naturalWidth)res();else img.onload=()=>res()})))}
export function loadSrc(src:string){return new Promise<HTMLImageElement>((res,rej)=>{const img=getImage(src);if(img.complete&&img.naturalWidth)res(img);else{img.onload=()=>res(img);img.onerror=rej}})}

const processed:Record<string,HTMLCanvasElement>={}
// 阴影/高光层是"均匀底色 + 褶皱变化" stored in alpha；减去众数基线只保留褶皱细节
function foldLayer(src:string,boost:number){
  const key=src+'@'+boost
  const hit=processed[key]
  if(hit)return hit
  const img=cache[src]
  if(!(img&&img.complete&&img.naturalWidth))return null
  const c=document.createElement('canvas')
  c.width=img.naturalWidth;c.height=img.naturalHeight
  const x=c.getContext('2d')
  if(!x)return null
  x.drawImage(img,0,0)
  const d=x.getImageData(0,0,c.width,c.height),p=d.data
  const hist=new Uint32Array(256)
  for(let i=3;i<p.length;i+=4)if(p[i]>0)hist[p[i]]++
  let base=0,best=0
  for(let a=0;a<256;a++)if(hist[a]>best){best=hist[a];base=a}
  for(let i=3;i<p.length;i+=4){const a=p[i];p[i]=a===0?0:Math.min(255,Math.max(0,a-base)*boost)}
  x.putImageData(d,0,0)
  processed[key]=c
  return c
}

function luminance(hex:string){
  const n=parseInt(hex.replace('#',''),16)
  return .299*(n>>16&255)/255+.587*(n>>8&255)/255+.114*(n&255)/255
}

// 在已归一化到 1062x926 坐标系的 ctx 上绘制服装（edit=true 时带印刷区域虚线）
export function drawGarment(x:CanvasRenderingContext2D,color:string,edit:boolean,face:'front'|'back'='front'){
  const shadowLayer=foldLayer(LAYERS.shadow,1.7)
  const highlightLayer=foldLayer(LAYERS.highlight,1.7)
  const base=cache[LAYERS.base],seams=cache[LAYERS.seams]
  if(!shadowLayer||!highlightLayer||!base||!seams)return
  x.clearRect(0,0,SRC_W,SRC_H)
  x.save()
  x.filter='blur(14px)'
  x.fillStyle='rgba(40,42,52,.16)'
  x.beginPath()
  x.ellipse(SRC_W/2,908,360,26,0,0,Math.PI*2)
  x.fill()
  x.restore()
  x.drawImage(base,0,0)
  x.globalCompositeOperation='source-in'
  x.fillStyle=color
  x.fillRect(0,0,SRC_W,SRC_H)
  x.globalCompositeOperation='multiply'
  x.drawImage(shadowLayer,0,0)
  x.globalCompositeOperation='screen'
  x.drawImage(highlightLayer,0,0)
  x.globalCompositeOperation='source-over'
  x.drawImage(seams,0,0)
  if(face==='front'){
    // 正面：补齐领口两侧螺纹（素材只有肩部和 scoop 底线，两侧是断的）
    const fl=luminance(color)<.45?'rgba(230,232,238,.85)':'#3a3a3e'
    const flSoft=luminance(color)<.45?'rgba(230,232,238,.5)':'rgba(58,58,62,.55)'
    x.strokeStyle=fl
    x.lineWidth=3
    x.beginPath();x.moveTo(470,47);x.quadraticCurveTo(450,62,447,90);x.stroke()
    x.beginPath();x.moveTo(592,47);x.quadraticCurveTo(612,62,615,90);x.stroke()
    x.strokeStyle=flSoft;x.lineWidth=1.3
    x.beginPath();x.moveTo(478,53);x.quadraticCurveTo(458,67,455,93);x.stroke()
    x.beginPath();x.moveTo(584,53);x.quadraticCurveTo(604,67,607,93);x.stroke()
  }else{
    // 背面：用领口蒙版盖住正面 scoop 领圈，重画后领
    const mask=cache[LAYERS.mask]
    if(mask){
      const t=document.createElement('canvas')
      t.width=SRC_W;t.height=SRC_H
      const tx=t.getContext('2d')
      if(tx){
        tx.drawImage(mask,0,0)
        tx.globalCompositeOperation='source-in'
        tx.fillStyle=color
        tx.fillRect(0,0,SRC_W,SRC_H)
        x.drawImage(t,0,0)
        const shade=(img:CanvasImageSource,mode:'multiply'|'screen',alpha=1)=>{
          tx.globalCompositeOperation='source-over'
          tx.clearRect(0,0,SRC_W,SRC_H)
          tx.drawImage(img,0,0)
          tx.globalCompositeOperation='destination-in'
          tx.drawImage(mask,0,0)
          x.globalCompositeOperation=mode
          x.globalAlpha=alpha
          x.drawImage(t,0,0)
          x.globalAlpha=1
          x.globalCompositeOperation='source-over'
        }
        shade(shadowLayer,'multiply')
        shade(highlightLayer,'screen',.35)
      }
    }
    // 领口上沿线 + 内侧罗纹（颜色随衣色深浅自适应）
    const line=luminance(color)<.45?'rgba(230,232,238,.85)':'#3a3a3e'
    const lineSoft=luminance(color)<.45?'rgba(230,232,238,.5)':'rgba(58,58,62,.55)'
    x.strokeStyle=line
    x.lineWidth=2.6
    x.beginPath();x.moveTo(464,44);x.quadraticCurveTo(531,58,596,44);x.stroke()
    x.strokeStyle=lineSoft;x.lineWidth=1.3
    x.beginPath();x.moveTo(460,56);x.quadraticCurveTo(531,72,600,56);x.stroke()
    // 罗纹下沿：软阴影 + 接缝线
    x.save()
    x.strokeStyle=luminance(color)<.45?'rgba(255,255,255,.08)':'rgba(20,22,28,.10)';x.lineWidth=12
    x.beginPath();x.moveTo(448,100);x.quadraticCurveTo(531,115,612,100);x.stroke()
    x.restore()
    x.strokeStyle=line;x.globalAlpha=.75;x.lineWidth=1.6
    x.beginPath();x.moveTo(448,96);x.quadraticCurveTo(531,111,612,96);x.stroke()
    x.globalAlpha=1
  }
  if(edit){
    const dark=luminance(color)<.45
    const main=dark?'rgba(255,255,255,.75)':'rgba(70,72,80,.8)'
    x.lineWidth=2.6
    x.setLineDash([13,10])
    x.strokeStyle=dark?'rgba(30,30,36,.55)':main
    if(dark){x.strokeRect(PRINT_AREA.x,PRINT_AREA.y,PRINT_AREA.w,PRINT_AREA.h);x.strokeStyle=main}
    x.strokeRect(PRINT_AREA.x,PRINT_AREA.y,PRINT_AREA.w,PRINT_AREA.h)
    x.setLineDash([])
  }
}

// 在服装坐标系上绘制设计图层（layer 坐标为印刷区百分比）
export function drawLayers(x:CanvasRenderingContext2D,layers:Layer[],area:{x:number,y:number,w:number,h:number}){
  for(const l of layers){
    const px=area.x+l.x/100*area.w
    const py=area.y+l.y/100*area.h
    x.save()
    x.translate(px,py)
    x.rotate(l.rotate*Math.PI/180)
    x.scale(l.scale*(l.flipX?-1:1),l.scale*(l.flipY?-1:1))
    if(l.opacity!=null&&l.opacity<1)x.globalAlpha=l.opacity
    if(l.type==='text'){
      const size=l.fontSize||32
      x.font=`${l.bold===false?'400':'800'} ${size}px ${l.fontFamily||'Arial, "Heiti SC", sans-serif'}`
      x.textAlign='center'
      x.textBaseline='middle'
      x.fillStyle=l.color||'#262a33'
      x.fillText(l.text||'',0,0)
    }else if(l.src){
      const img=cache[l.src]
      if(img&&img.complete&&img.naturalWidth){
        const s=Math.min(1,170/img.naturalWidth,180/img.naturalHeight)
        const w=img.naturalWidth*s,h=img.naturalHeight*s
        x.drawImage(img,-w/2,-h/2,w,h)
      }
    }
    x.restore()
  }
}

export default function TshirtMockup({color,edit,face}:{color:string;edit:boolean;face?:'front'|'back'}){
  const ref=useRef<HTMLCanvasElement>(null)
  const draw=()=>{
    const c=ref.current
    if(!c)return
    const imgs=Object.values(LAYERS).map(s=>cache[s])
    if(imgs.some(i=>!(i&&i.complete&&i.naturalWidth)))return
    const dpr=window.devicePixelRatio||1
    const cssW=c.clientWidth,cssH=cssW*SRC_H/SRC_W
    if(c.width!==Math.round(cssW*dpr)){c.width=Math.round(cssW*dpr);c.height=Math.round(cssH*dpr)}
    const x=c.getContext('2d')
    if(!x)return
    x.setTransform(c.width/SRC_W,0,0,c.height/SRC_H,0,0)
    drawGarment(x,color,edit,face)
  }
  useEffect(()=>{
    const redraw=()=>draw()
    Object.values(LAYERS).forEach(s=>getImage(s,redraw))
    draw()
  })
  useEffect(()=>{draw()},[color,edit,face])
  return <canvas ref={ref} className="mockup-canvas" aria-label="T 恤预览"/>
}
