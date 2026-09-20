// 小红书开放平台 API 客户端（服务端专用，App Secret 不可进入浏览器）
// 签名算法（商家自研 v3 common_controller）:
//   original = method + '?appId=' + appKey + '&timestamp=' + ts + '&version=' + version + appSecret
//   sign = md5(original)  // 32 位小写
import crypto from 'crypto'

export type XhsConfig={appKey:string,appSecret:string,version?:string,accessToken?:string,timeoutMs?:number}
export const XHS_API_URL='https://ark.xiaohongshu.com/ark/open_api/v3/common_controller'

export function xhsSign(method:string,appKey:string,timestamp:number,version:string,appSecret:string){
  return crypto.createHash('md5').update(`${method}?appId=${appKey}&timestamp=${timestamp}&version=${version}${appSecret}`).digest('hex')
}

export type XhsCallResult={http:number,body:Record<string,unknown>|{raw:string}}

export async function xhsCall(cfg:XhsConfig,method:string,params:Record<string,unknown>={}):Promise<XhsCallResult>{
  const timestamp=Math.floor(Date.now()/1000)
  const version=cfg.version||'2.0'
  const body:Record<string,unknown>={}
  for(const[k,v]of Object.entries(params))if(v!==null&&v!==undefined&&v!=='')body[k]=v
  body.appId=cfg.appKey
  body.timestamp=timestamp
  body.version=version
  body.method=method
  body.sign=xhsSign(method,cfg.appKey,timestamp,version,cfg.appSecret)
  if(cfg.accessToken)body.accessToken=cfg.accessToken
  const ctrl=new AbortController()
  const timer=setTimeout(()=>ctrl.abort(),cfg.timeoutMs||10000)
  try{
    const res=await fetch(XHS_API_URL,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body),signal:ctrl.signal})
    const text=await res.text()
    let json:XhsCallResult['body']
    try{json=JSON.parse(text)}catch{json={raw:text}}
    return{http:res.status,body:json}
  }finally{clearTimeout(timer)}
}

// ---------- 接口封装 ----------

// 连通性验证（快递公司列表，无业务参数）
export const ping=(cfg:XhsConfig)=>xhsCall(cfg,'common.getExpressCompanyList')

// 末级类目列表（创建商品需要 categoryId）
export const getCategories=(cfg:XhsConfig)=>xhsCall(cfg,'common.getCategories')

// 运费模板列表（创建商品需要 logisticsPlanId）
export const getCarriageTemplateList=(cfg:XhsConfig)=>xhsCall(cfg,'common.getCarriageTemplateList')

// 素材上传（商品图片先到小红书 CDN，imageBase64 为不带前缀的 base64；参数名以实测为准）
export const uploadMaterial=(cfg:XhsConfig,imageBase64:string,fileType='png')=>xhsCall(cfg,'material.uploadMaterial',{imageBase64,fileType})

// 创建商品（payload 由 route 层映射后透传）
export const createItemAndSku=(cfg:XhsConfig,payload:Record<string,unknown>)=>xhsCall(cfg,'product.createItemAndSku',payload)

// 商品列表（验证铺货结果）
export const searchItemList=(cfg:XhsConfig,params:Record<string,unknown>={})=>xhsCall(cfg,'product.searchItemList',{pageNo:1,pageSize:20,...params})

// 订单列表
export const getOrderList=(cfg:XhsConfig,params:Record<string,unknown>={})=>xhsCall(cfg,'order.getOrderList',{pageNo:1,pageSize:20,...params})

// 订单详情
export const getOrderDetail=(cfg:XhsConfig,orderId:string)=>xhsCall(cfg,'order.getOrderDetail',{orderId})

// 发货回填（运单号）
export const orderDeliver=(cfg:XhsConfig,orderId:string,expressCompanyCode:string,expressTrackingNo:string)=>xhsCall(cfg,'order.orderDeliver',{orderId,expressCompanyCode,expressTrackingNo})
