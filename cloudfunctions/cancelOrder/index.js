const cloud = require('wx-server-sdk')
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID
  const { orderId } = event

  if (!orderId) {
    return {
      success: false,
      message: '缺少订单ID'
    }
  }

  try {
    // 获取订单信息
    const orderRes = await db.collection('orders').doc(orderId).get()
    
    if (!orderRes.data) {
      return {
        success: false,
        message: '订单不存在'
      }
    }

    const order = orderRes.data

    // 验证权限：订单所有者或商户可以取消
    const whitelistRes = await db.collection('merchantWhitelist')
      .where({ openid: openid, status: 1 })
      .get()
    const isMerchant = whitelistRes.data.length > 0

    if (order._openid !== openid && !isMerchant) {
      return {
        success: false,
        message: '无权限取消该订单'
      }
    }

    // 只有待支付状态的订单可以取消
    if (order.status !== 0) {
      return {
        success: false,
        message: '当前订单状态不可取消'
      }
    }

    await db.collection('orders').doc(orderId).update({
      data: {
        status: 5,
        updateTime: new Date().getTime()
      }
    })

    return {
      success: true
    }
  } catch (err) {
    console.error('取消订单失败', err)
    return {
      success: false,
      message: '取消订单失败'
    }
  }
}