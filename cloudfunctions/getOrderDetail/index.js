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
    const orderRes = await db.collection('orders').doc(orderId).get()
    
    if (!orderRes.data) {
      return {
        success: false,
        message: '订单不存在'
      }
    }

    const order = orderRes.data

    const whitelistRes = await db.collection('merchantWhitelist')
      .where({ openid: openid, status: 1 })
      .get()
    const isMerchant = whitelistRes.data.length > 0

    if (order._openid !== openid && !isMerchant) {
      return {
        success: false,
        message: '无权限查看该订单'
      }
    }

    return {
      success: true,
      data: {
        ...order,
        orderNo: order.orderNo || (order._id || '').slice(-8)
      }
    }
  } catch (err) {
    console.error('获取订单详情失败', err)
    return {
      success: false,
      message: '获取订单详情失败'
    }
  }
}