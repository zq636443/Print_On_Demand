export type Layer={id:string,type:'image'|'text',src?:string,text?:string,x:number,y:number,scale:number,rotate:number,fontSize?:number,color?:string}
export type Face={layers:Layer[],color:string}
export type State={front:Face,back:Face}
