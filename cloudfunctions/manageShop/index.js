const cloud = require('wx-server-sdk')
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

// 验证商户权限
async function checkMerchantPermission(wxContext) {
  const whitelist = await db.collection('merchantWhitelist')
    .where({ openid: wxContext.OPENID, status: 1 })
    .get()
  return whitelist.data.length > 0
}

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const { action, shopData } = event

  // 写操作需要商户权限
  if (['update'].includes(action)) {
    const hasPermission = await checkMerchantPermission(wxContext)
    if (!hasPermission) {
      return { success: false, message: '无权限访问' }
    }
  }

  switch (action) {
    case 'get':
      return await getShopInfo()
    case 'update':
      return await updateShopInfo(shopData, wxContext)
    case 'toggleAutoAccept':
      return await toggleAutoAccept(wxContext)
    default:
      return { success: false, message: '未知操作' }
  }
}

async function getShopInfo() {
  try {
    const res = await db.collection('shopInfo').limit(1).get()
    if (res.data.length > 0) {
      return { success: true, data: res.data[0] }
    } else {
      // 返回默认配置，默认开启自动接单
      return {
        success: true,
        data: {
          name: '我的店铺',
          autoAcceptOrder: true,
          businessHours: '10:00-22:00'
        }
      }
    }
  } catch (err) {
    console.error('获取店铺信息失败', err)
    return { success: false, message: '获取店铺信息失败' }
  }
}

async function updateShopInfo(shopData, wxContext) {
  if (!shopData) {
    return { success: false, message: '缺少店铺数据' }
  }

  try {
    const updateData = {
      ...shopData,
      updateTime: new Date().getTime()
    }

    // 查找现有记录
    const existingRes = await db.collection('shopInfo').limit(1).get()

    if (existingRes.data.length > 0) {
      await db.collection('shopInfo').doc(existingRes.data[0]._id).update({
        data: updateData
      })
    } else {
      await db.collection('shopInfo').add({
        data: {
          ...updateData,
          createTime: new Date().getTime()
        }
      })
    }

    return { success: true, message: '更新成功' }
  } catch (err) {
    console.error('更新店铺信息失败', err)
    return { success: false, message: '更新店铺信息失败' }
  }
}

async function toggleAutoAccept(wxContext) {
  try {
    const existingRes = await db.collection('shopInfo').limit(1).get()

    if (existingRes.data.length > 0) {
      const currentStatus = existingRes.data[0].autoAcceptOrder === true
      const newStatus = !currentStatus

      await db.collection('shopInfo').doc(existingRes.data[0]._id).update({
        data: {
          autoAcceptOrder: newStatus,
          updateTime: new Date().getTime()
        }
      })

      return {
        success: true,
        data: { autoAcceptOrder: newStatus },
        message: newStatus ? '已开启自动接单' : '已关闭自动接单'
      }
    } else {
      // 创建新记录，默认开启自动接单
      await db.collection('shopInfo').add({
        data: {
          name: '我的店铺',
          autoAcceptOrder: true,
          businessHours: '10:00-22:00',
          createTime: new Date().getTime(),
          updateTime: new Date().getTime()
        }
      })

      return {
        success: true,
        data: { autoAcceptOrder: true },
        message: '已开启自动接单'
      }
    }
  } catch (err) {
    console.error('切换自动接单失败', err)
    return { success: false, message: '操作失败' }
  }
}