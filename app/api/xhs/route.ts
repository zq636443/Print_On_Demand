import {NextRequest,NextResponse} from 'next/server'
import {ping,getCategories,getCarriageTemplateList,uploadMaterial,createItemAndSku,searchItemList,getOrderList,getOrderDetail,orderDeliver,type XhsConfig} from '@/lib/xhs/client'

type Action='ping'|'categories'|'carriage'|'publish'|'items'|'orders'|'order-detail'|'ship'

type PublishProduct={
  name:string
  price:number            // 元
  stock?:number
  desc?:string
  imageUrls?:string[]     // 已在小红书 CDN 的图片 URL
  imageBase64?:string     // 预览图 base64（先走素材上传）
  specs?:{name:string,values:string[]}[]   // 例：[{name:'颜色',values:['白色','黑色']},{name:'尺码',values:['M','L']}]
  categoryId?:string
  logisticsPlanId?:string
  outItemId?:string       // 外部商品编码（幂等：平台产品 ID）
}

// 平台产品 → 小红书 createItemAndSku 请求体映射
// 注意：v3 接口的精确字段结构需与官方文档逐字段对齐，实测时在此函数内调整
function mapToCreateItemAndSku(p:PublishProduct){
  const skus:{[k:string]:unknown}[]=[]
  const colorSpec=p.specs?.find(s=>/颜色|色/.test(s.name))||p.specs?.[0]
  const sizeSpec=p.specs?.find(s=>/尺码|大小|号/.test(s.name))||p.specs?.[1]
  const colors=colorSpec?.values?.length?colorSpec.values:['默认']
  const sizes=sizeSpec?.values?.length?sizeSpec.values:['均码']
  for(const c of colors)for(const s of sizes){
    skus.push({
      skuCode:(p.outItemId||'')+'-'+c+'-'+s,
      price:p.price,
      stock:p.stock??999,
      variants:[{name:'颜色',value:c},{name:'尺码',value:s}],
    })
  }
  return {
    name:p.name,
    briefName:p.name.slice(0,12),
    desc:p.desc||'个性化定制商品，按需生产',
    imageUrls:p.imageUrls,
    outItemId:p.outItemId,
    itemAndSkuInfoList:skus,
    categoryId:p.categoryId,
    logisticsPlanId:p.logisticsPlanId,
  }
}

export async function POST(req:NextRequest){
  let body:{action?:Action,account?:XhsConfig,payload?:Record<string,unknown>}
  try{body=await req.json()}catch{return NextResponse.json({ok:false,error:'请求体不是合法 JSON'},{status:400})}
  const{action,account,payload={}}=body
  if(!account?.appKey||!account?.appSecret)return NextResponse.json({ok:false,error:'缺少 App Key / App Secret'},{status:400})
  try{
    switch(action){
      case 'ping':{
        const r=await ping(account)
        return NextResponse.json({ok:true,http:r.http,result:r.body})
      }
      case 'categories':{
        const r=await getCategories(account)
        return NextResponse.json({ok:true,http:r.http,result:r.body})
      }
      case 'carriage':{
        const r=await getCarriageTemplateList(account)
        return NextResponse.json({ok:true,http:r.http,result:r.body})
      }
      case 'publish':{
        const p=payload as unknown as PublishProduct
        if(!p?.name)return NextResponse.json({ok:false,error:'缺少商品名称'},{status:400})
        let imageUrls=p.imageUrls||[]
        let material:unknown
        if(p.imageBase64){
          const m=await uploadMaterial(account,p.imageBase64)
          material=m.body
          const data=(m.body as Record<string,unknown>)?.data as Record<string,unknown>|undefined
          const url=(data?.url||data?.imageUrl||data?.link) as string|undefined
          if(url)imageUrls=[url]
        }
        if(imageUrls.length===0)return NextResponse.json({ok:false,error:'缺少商品图片（imageUrls 或 imageBase64）',material})
        const r=await createItemAndSku(account,mapToCreateItemAndSku({...p,imageUrls}))
        return NextResponse.json({ok:true,http:r.http,result:r.body,material})
      }
      case 'items':{
        const r=await searchItemList(account,payload)
        return NextResponse.json({ok:true,http:r.http,result:r.body})
      }
      case 'orders':{
        const r=await getOrderList(account,payload)
        return NextResponse.json({ok:true,http:r.http,result:r.body})
      }
      case 'order-detail':{
        if(!payload.orderId)return NextResponse.json({ok:false,error:'缺少 orderId'},{status:400})
        const r=await getOrderDetail(account,String(payload.orderId))
        return NextResponse.json({ok:true,http:r.http,result:r.body})
      }
      case 'ship':{
        const{orderId,expressCompanyCode,expressTrackingNo}=payload as {orderId?:string,expressCompanyCode?:string,expressTrackingNo?:string}
        if(!orderId||!expressCompanyCode||!expressTrackingNo)return NextResponse.json({ok:false,error:'缺少 orderId / expressCompanyCode / expressTrackingNo'},{status:400})
        const r=await orderDeliver(account,orderId,expressCompanyCode,expressTrackingNo)
        return NextResponse.json({ok:true,http:r.http,result:r.body})
      }
      default:
        return NextResponse.json({ok:false,error:'未知 action：'+String(action)},{status:400})
    }
  }catch(e){
    return NextResponse.json({ok:false,error:e instanceof Error?e.message:String(e)},{status:502})
  }
}
