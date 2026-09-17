// 服装 mockup 的纯函数定义：SVG 字符串生成 + 模板配置
// 编辑器渲染（ GarmentSvg 组件）、首页卡片缩略图、导出 PNG 三处共用

export type GarmentKind='tshirt'|'crew'|'hoodie'|'mug'

export const TEMPLATE_KIND:Record<string,GarmentKind>={'短袖 T 恤':'tshirt','圆领卫衣':'crew','连帽卫衣':'hoodie','马克杯':'mug'}

export type GarmentConf={price:number,colors:string[],areaPct:{x:number,y:number,w:number,h:number},areaVb:{x:number,y:number,w:number,h:number}}
export const GARMENTS:Record<GarmentKind,GarmentConf>={
  tshirt:{price:22,colors:['#f5f5f1','#92949b','#202431'],areaPct:{x:30.04,y:23.54,w:40.01,h:51.94},areaVb:{x:319,y:218,w:425,h:481}},
  crew:{price:35,colors:['#f5f5f1','#92949b','#202431','#d9c7a7'],areaPct:{x:25,y:26.4,w:36,h:39.5},areaVb:{x:100,y:116,w:144,h:174}},
  hoodie:{price:49,colors:['#f5f5f1','#92949b','#202431','#7a8b6f'],areaPct:{x:32.5,y:26.4,w:35,h:31.8},areaVb:{x:130,y:116,w:140,h:140}},
  mug:{price:18,colors:['#f5f5f1','#202431','#e23057','#1d6fd1'],areaPct:{x:35.5,y:34.1,w:29,h:31.8},areaVb:{x:142,y:150,w:116,h:140}},
}

function luminance(hex:string){
  const n=parseInt(hex.replace('#',''),16)
  return .299*(n>>16&255)/255+.587*(n>>8&255)/255+.114*(n&255)/255
}
function printRect(area:{x:number,y:number,w:number,h:number},color:string){
  const dark=luminance(color)<.45
  const stroke=dark?'rgba(255,255,255,.8)':'rgba(70,72,80,.85)'
  return `<rect x="${area.x}" y="${area.y}" width="${area.w}" height="${area.h}" rx="4" fill="none" stroke="${stroke}" stroke-width="2" stroke-dasharray="8 6"/>`
}

const BODY={
  crew:'M150 66 C162 88 180 98 200 98 C220 98 238 88 250 66 L318 96 L366 258 L332 270 L302 196 L300 374 Q300 394 280 394 L120 394 Q100 394 100 374 L98 196 L68 270 L34 258 L82 96 Z',
  crewBack:'M152 62 C164 84 180 93 200 93 C220 93 236 84 248 62 L318 96 L366 258 L332 270 L302 196 L300 374 Q300 394 280 394 L120 394 Q100 394 100 374 L98 196 L68 270 L34 258 L82 96 Z',
  hoodieBody:'M150 68 C162 92 180 102 200 102 C220 102 238 92 250 68 L320 98 L368 260 L334 272 L304 198 L302 374 Q302 394 282 394 L118 394 Q98 394 98 374 L96 198 L66 272 L32 260 L80 98 Z',
  hoodieBackBody:'M152 64 C164 88 180 97 200 97 C220 97 236 88 248 64 L320 98 L368 260 L334 272 L304 198 L302 374 Q302 394 282 394 L118 394 Q98 394 98 374 L96 198 L66 272 L32 260 L80 98 Z',
}
const RIBS=`<path d="M102 376 L298 376 M104 386 L296 386" fill="none" stroke="#3c3c40" stroke-width="1.4" opacity=".55"/><path d="M330 274 L364 262 M326 262 L356 251 M74 274 L40 262 M78 262 L48 251" fill="none" stroke="#3c3c40" stroke-width="1.4" opacity=".55"/><path d="M302 200 Q286 214 284 238 M98 200 Q114 214 116 238" fill="none" stroke="#3c3c40" stroke-width="1.2" opacity=".45"/><path d="M150 250 L148 358 M250 250 L252 358" fill="none" stroke="#3c3c40" stroke-width="1" opacity=".3"/>`

function crewSvg(color:string,back:boolean,edit:boolean){
  const body=back?BODY.crewBack:BODY.crew
  const neck=back
    ?`<path d="M152 62 C164 84 180 93 200 93 C220 93 236 84 248 62" fill="none" stroke="#3c3c40" stroke-width="3"/>`
    :`<path d="M150 66 C162 88 180 98 200 98 C220 98 238 88 250 66" fill="none" stroke="#3c3c40" stroke-width="3"/><path d="M157 71 C167 91 182 100 200 100 C218 100 233 91 243 71" fill="none" stroke="#3c3c40" stroke-width="1.2" opacity=".55"/>`
  const label=back?`<rect x="188" y="112" width="24" height="14" rx="2" fill="none" stroke="#3c3c40" stroke-width="1.2" opacity=".5"/>`:''
  return `<ellipse cx="200" cy="416" rx="135" ry="10" fill="rgba(40,42,52,.12)"/><path d="${body}" fill="${color}" stroke="#3c3c40" stroke-width="3" stroke-linejoin="round"/>${neck}${RIBS}${label}${edit?printRect(GARMENTS.crew.areaVb,color):''}`
}

function hoodieSvg(color:string,back:boolean,edit:boolean){
  const hood=`<path d="M150 68 C138 14 262 14 250 68 C238 92 220 102 200 102 C180 102 162 92 150 68 Z" fill="${color}" stroke="#3c3c40" stroke-width="3"/><path d="M200 22 L200 42 M179 26 Q185 44 183 58 M221 26 Q215 44 217 58" fill="none" stroke="#3c3c40" stroke-width="1.2" opacity=".5"/><path d="M150 68 C162 92 180 102 200 102 C220 102 238 92 250 68" fill="none" stroke="#3c3c40" stroke-width="3"/>`
  const strings=back?'':`<path d="M184 100 q-3 20 -8 30 M216 100 q3 20 8 30" fill="none" stroke="#3c3c40" stroke-width="2.5"/><circle cx="176" cy="132" r="2.6" fill="#3c3c40"/><circle cx="224" cy="132" r="2.6" fill="#3c3c40"/>`
  const pocket=back?'':`<path d="M148 296 L252 296 L264 372 L136 372 Z" fill="${color}" stroke="#3c3c40" stroke-width="2.5"/><path d="M148 296 L252 296" fill="none" stroke="#3c3c40" stroke-width="5"/>`
  const body=back?BODY.hoodieBackBody:BODY.hoodieBody
  const drop=back?`<path d="M150 70 C136 122 144 172 168 202 L232 202 C256 172 264 122 250 70" fill="${color}" opacity=".92"/>`:''
  return `<ellipse cx="200" cy="416" rx="138" ry="10" fill="rgba(40,42,52,.12)"/><path d="${body}" fill="${color}" stroke="#3c3c40" stroke-width="3" stroke-linejoin="round"/>${drop}${hood}${strings}${pocket}${RIBS}${edit?printRect(GARMENTS.hoodie.areaVb,color):''}`
}

function mugSvg(color:string,_back:boolean,edit:boolean){
  return `<ellipse cx="200" cy="402" rx="112" ry="9" fill="rgba(40,42,52,.12)"/><path d="M286 116 C354 108 354 234 286 226 C297 217 297 125 286 116 Z" fill="${color}" stroke="#3c3c40" stroke-width="3"/><path d="M114 84 L286 84 L278 352 Q200 368 122 352 Z" fill="${color}" stroke="#3c3c40" stroke-width="3"/><ellipse cx="200" cy="84" rx="86" ry="13" fill="rgba(20,22,28,.16)" stroke="#3c3c40" stroke-width="3"/><path d="M122 352 Q200 368 278 352" fill="none" stroke="#3c3c40" stroke-width="1.5" opacity=".55"/><path d="M140 104 C130 180 130 280 142 344" fill="none" stroke="rgba(255,255,255,.5)" stroke-width="9" stroke-linecap="round"/><path d="M118 78 Q200 94 282 78" fill="none" stroke="rgba(255,255,255,.55)" stroke-width="2"/>${edit?printRect(GARMENTS.mug.areaVb,color):''}`
}

function tshirtSvg(color:string,_back:boolean,edit:boolean){
  return `<ellipse cx="600" cy="1105" rx="400" ry="24" fill="rgba(40,42,52,.12)"/><path d="M390 170 L155 300 L45 565 l145 90 92-153 v510 q0 58 58 58 h220 q58 0 58-58 V502 l92 153 145-90 l-110-265 L510 170 Q455 262 400 262 Q345 262 390 170 Z" fill="${color}" stroke="#3c3c40" stroke-width="7" stroke-linejoin="round"/><path d="M390 170 Q455 262 400 262 Q345 262 390 170" fill="none" stroke="#3c3c40" stroke-width="6"/><path d="M390 180 Q450 270 400 270 Q350 270 390 180" fill="none" stroke="#3c3c40" stroke-width="2" opacity=".55"/><path d="M180 655 L245 502 M1020 655 L955 502 M345 1012 h420" fill="none" stroke="#3c3c40" stroke-width="3" opacity=".45"/><path d="M205 330 L80 565 M995 330 l125 235" fill="none" stroke="rgba(255,255,255,.5)" stroke-width="26" opacity=".5"/>${edit?printRect({x:330,y:360,w:450,h:520},color):''}`
}

export function mockupSvg(kind:GarmentKind,color:string,face:'front'|'back',edit:boolean):string{
  if(kind==='tshirt')return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 1200">${tshirtSvg(color,false,edit)}</svg>`
  const inner=kind==='crew'?crewSvg(color,face==='back',edit):kind==='hoodie'?hoodieSvg(color,face==='back',edit):mugSvg(color,false,edit)
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 440">${inner}</svg>`
}
