export type Layer={id:string,type:'image'|'text',src?:string,text?:string,x:number,y:number,scale:number,rotate:number,fontSize?:number,color?:string,flipX?:boolean,flipY?:boolean,opacity?:number,fontFamily?:string,bold?:boolean}
export type Face={layers:Layer[],color:string}
export type State={front:Face,back:Face}
