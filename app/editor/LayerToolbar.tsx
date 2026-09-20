'use client'
import type {Layer} from './types'

export const FONTS=[
  {name:'黑体',value:'Arial, "Heiti SC", sans-serif'},
  {name:'衬线',value:'Georgia, "Songti SC", serif'},
  {name:'手写',value:'"Bradley Hand", "Zapfino", cursive'},
]

export default function LayerToolbar({layer,onEdit,onDuplicate,onMove,onDelete}:{layer:Layer,onEdit:(p:Partial<Layer>)=>void,onDuplicate:()=>void,onMove:(dir:1|-1)=>void,onDelete:()=>void}){
  return <div className="layer-tools">
    {layer.type==='image'&&<>
      <button className="icon-tool" title="水平翻转" onClick={()=>onEdit({flipX:!layer.flipX})}>⇋</button>
      <button className="icon-tool" title="竖直翻转" onClick={()=>onEdit({flipY:!layer.flipY})}>⇅</button>
      <div className="tool-sep"/>
    </>}
    <button className="icon-tool" title="复制图层" onClick={onDuplicate}>⧉</button>
    <button className="icon-tool" title="上移一层" onClick={()=>onMove(1)}>⬆</button>
    <button className="icon-tool" title="下移一层" onClick={()=>onMove(-1)}>⬇</button>
    <div className="tool-sep"/>
    <button className="icon-tool" title="居中" onClick={()=>onEdit({x:50,y:50})}>⌗</button>
    <button className="icon-tool" title="旋转 90°" onClick={()=>onEdit({rotate:(layer.rotate+90)%360})}>⟳</button>
    <button className="icon-tool" title="放大" onClick={()=>onEdit({scale:Math.min(5,layer.scale+.1)})}>＋</button>
    <button className="icon-tool" title="缩小" onClick={()=>onEdit({scale:Math.max(.15,layer.scale-.1)})}>−</button>
    <div className="tool-sep"/>
    {layer.type==='image'&&<label className="opacity-box" title="透明度"><input type="range" min="10" max="100" value={Math.round((layer.opacity??1)*100)} onChange={e=>onEdit({opacity:+e.target.value/100})}/><span>{Math.round((layer.opacity??1)*100)}%</span></label>}
    {layer.type==='text'&&<>
      <select className="font-select" value={layer.fontFamily||FONTS[0].value} onChange={e=>onEdit({fontFamily:e.target.value})}>{FONTS.map(f=><option key={f.name} value={f.value} style={{fontFamily:f.value}}>{f.name}</option>)}</select>
      <button className={(layer.bold??true)?'icon-tool on-bold':'icon-tool'} title="粗体" onClick={()=>onEdit({bold:!(layer.bold??true)})}>B</button>
    </>}
    <div className="tool-sep"/>
    <button className="icon-tool" title="删除图层" onClick={onDelete}>⌫</button>
  </div>
}
