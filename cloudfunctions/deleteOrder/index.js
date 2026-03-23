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
    // 验证商户权限
    const whitelistRes = await db.collection('merchantWhitelist')
      .where({ openid: openid, status: 1 })
      .get()

    if (whitelistRes.data.length === 0) {
      return {
        success: false,
        message: '无权限：仅商户可删除订单'
      }
    }

    // 检查订单是否存在
    const orderRes = await db.collection('orders').doc(orderId).get()
    if (!orderRes.data) {
      return {
        success: false,
        message: '订单不存在'
      }
    }

    const order = orderRes.data

    // 只允许删除待支付、已完成、已取消、已退款状态的订单
    const deletableStatus = [0, 4, 5, 6]
    if (!deletableStatus.includes(order.status)) {
      return {
        success: false,
        message: '该订单状态不允许删除'
      }
    }

    // 删除订单
    await db.collection('orders').doc(orderId).remove()

    // 记录删除日志到 config 集合
    await db.collection('config').add({
      data: {
        key: 'order_deleted',
        orderId: orderId,
        orderNo: order.orderNo,
        deletedBy: openid,
        deletedAt: Date.now()
      }
    }).catch(() => {})

    return {
      success: true,
      message: '删除成功'
    }
  } catch (err) {
    console.error('删除订单失败', err)
    return {
      success: false,
      message: '删除失败'
    }
  }
}