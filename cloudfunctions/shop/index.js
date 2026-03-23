/**
 * 店铺服务云函数
 * 整合：manageShop
 */

const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()

// 店铺信息固定 ID
const SHOP_INFO_ID = 'main'

exports.main = async (event, context) => {
  const { action } = event

  switch (action) {
    case 'get': return await getShopInfo(event, context)
    case 'update': return await updateShopInfo(event, context)
    case 'toggleAutoAccept': return await toggleAutoAccept(event, context)
    default: return { success: false, message: '未知操作' }
  }
}

// 获取店铺信息
async function getShopInfo(event, context) {
  try {
    const res = await db.collection('shopInfo').doc(SHOP_INFO_ID).get()
    return { success: true, data: res.data || {} }
  } catch (err) {
    // 如果不存在，返回空对象
    if (err.errMsg?.includes('not exist')) {
      return { success: true, data: {} }
    }
    return { success: false, message: '获取失败' }
  }
}

// 更新店铺信息
async function updateShopInfo(event, context) {
  if (!await checkMerchantPermission()) return { success: false, message: '无权限' }

  const { shopData } = event

  try {
    // 使用 set 方法，不存在则创建
    await db.collection('shopInfo').doc(SHOP_INFO_ID).set({
      data: { 
        _id: SHOP_INFO_ID,
        ...shopData, 
        updateTime: Date.now() 
      }
    })

    return { success: true }
  } catch (err) {
    return { success: false, message: '更新失败' }
  }
}

// 切换自动接单
async function toggleAutoAccept(event, context) {
  if (!await checkMerchantPermission()) return { success: false, message: '无权限' }

  try {
    const res = await db.collection('shopInfo').doc(SHOP_INFO_ID).get()
    const newValue = !res.data?.autoAcceptOrder
    
    await db.collection('shopInfo').doc(SHOP_INFO_ID).update({
      data: { autoAcceptOrder: newValue, updateTime: Date.now() }
    })
    
    return { success: true, message: newValue ? '已开启自动接单' : '已关闭自动接单' }
  } catch (err) {
    return { success: false, message: '操作失败' }
  }
}

async function checkMerchantPermission() {
  const wxContext = cloud.getWXContext()
  const res = await db.collection('merchantWhitelist').where({ openid: wxContext.OPENID, status: 1 }).get()
  return res.data.length > 0
}