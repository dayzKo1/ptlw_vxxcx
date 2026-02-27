const cloud = require('wx-server-sdk')
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const _ = db.command

// 订单超时时间（15 分钟）
const ORDER_TIMEOUT = 15 * 60 * 1000

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()

  // 验证商户权限
  const whitelist = await db.collection('merchantWhitelist')
    .where({ openid: wxContext.OPENID, status: 1 })
    .get()

  if (whitelist.data.length === 0) {
    return { success: false, message: '无权限访问' }
  }

  try {
    const now = new Date().getTime()
    const timeoutThreshold = now - ORDER_TIMEOUT

    // 查找超时未支付的订单（状态 0=待支付，且创建时间超过 15 分钟）
    const timeoutOrdersRes = await db.collection('orders')
      .where({
        status: 0,
        createTime: _.lt(timeoutThreshold)
      })
      .get()

    if (timeoutOrdersRes.data.length === 0) {
      return { success: true, data: { cancelledCount: 0 }, message: '无超时订单' }
    }

    // 批量更新订单状态为已取消
    const updatePromises = timeoutOrdersRes.data.map(order => {
      return db.collection('orders').doc(order._id).update({
        data: {
          status: 4, // 已取消
          cancelTime: now,
          cancelReason: '超时未支付'
        }
      })
    })

    await Promise.all(updatePromises)

    console.log(`自动取消超时订单，数量：${timeoutOrdersRes.data.length}`)

    return {
      success: true,
      data: {
        cancelledCount: timeoutOrdersRes.data.length,
        orderIds: timeoutOrdersRes.data.map(o => o._id)
      },
      message: `已取消 ${timeoutOrdersRes.data.length} 个超时订单`
    }
  } catch (err) {
    console.error('取消超时订单失败', err)
    return { success: false, message: '取消超时订单失败' }
  }
}
