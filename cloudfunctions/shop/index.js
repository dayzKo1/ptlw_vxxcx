/**
 * 店铺服务云函数
 * 整合：manageShop
 */

const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()

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
    const res = await db.collection('shopInfo').limit(1).get()
    return { success: true, data: res.data[0] || {} }
  } catch (err) {
    return { success: false, message: '获取失败' }
  }
}

// 更新店铺信息
async function updateShopInfo(event, context) {
  if (!await checkMerchantPermission()) return { success: false, message: '无权限' }

  const { shopData } = event

  try {
    const res = await db.collection('shopInfo').limit(1).get()
    
    if (res.data.length > 0) {
      await db.collection('shopInfo').doc(res.data[0]._id).update({
        data: { ...shopData, updateTime: Date.now() }
      })
    } else {
      await db.collection('shopInfo').add({
        data: { ...shopData, createTime: Date.now() }
      })
    }

    return { success: true }
  } catch (err) {
    return { success: false, message: '更新失败' }
  }
}

// 切换自动接单
async function toggleAutoAccept(event, context) {
  if (!await checkMerchantPermission()) return { success: false, message: '无权限' }

  try {
    const res = await db.collection('shopInfo').limit(1).get()
    
    if (res.data.length > 0) {
      const newValue = !res.data[0].autoAcceptOrder
      await db.collection('shopInfo').doc(res.data[0]._id).update({
        data: { autoAcceptOrder: newValue, updateTime: Date.now() }
      })
      return { success: true, message: newValue ? '已开启自动接单' : '已关闭自动接单' }
    }

    return { success: false, message: '店铺信息不存在' }
  } catch (err) {
    return { success: false, message: '操作失败' }
  }
}

async function checkMerchantPermission() {
  const wxContext = cloud.getWXContext()
  const res = await db.collection('merchantWhitelist').where({ openid: wxContext.OPENID, status: 1 }).get()
  return res.data.length > 0
}