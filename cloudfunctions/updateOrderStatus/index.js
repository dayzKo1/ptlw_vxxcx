const cloud = require('wx-server-sdk')
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

// 订单状态文本映射
const STATUS_TEXT = {
  1: '制作中',
  2: '已出餐',
  3: '已完成',
  4: '已取消'
}

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const { orderId, status } = event

  if (!orderId || status === undefined) {
    return {
      success: false,
      message: '缺少必要参数'
    }
  }

  // 验证商户权限
  const whitelist = await db.collection('merchantWhitelist')
    .where({ openid: wxContext.OPENID, status: 1 })
    .get()

  if (whitelist.data.length === 0) {
    return {
      success: false,
      message: '无权限访问'
    }
  }

  try {
    // 获取订单信息
    const orderRes = await db.collection('orders').doc(orderId).get()
    if (!orderRes.data) {
      return { success: false, message: '订单不存在' }
    }

    const order = orderRes.data
    const userOpenid = order.openid

    // 更新订单状态
    await db.collection('orders').doc(orderId).update({
      data: {
        status: status,
        updateTime: new Date().getTime()
      }
    })

    // 发送订阅消息通知（如果用户已订阅）
    if (userOpenid && STATUS_TEXT[status]) {
      try {
        await sendOrderStatusNotification(userOpenid, orderId, status, order.tableNumber)
      } catch (notifyErr) {
        console.error('发送通知失败', notifyErr)
        // 通知失败不影响订单更新
      }
    }

    return {
      success: true,
      message: '订单状态更新成功'
    }
  } catch (err) {
    console.error('更新订单状态失败', err)
    return {
      success: false,
      message: '更新订单状态失败'
    }
  }
}

// 发送订单状态变更通知
async function sendOrderStatusNotification(userOpenid, orderId, status, tableNumber) {
  const statusText = STATUS_TEXT[status] || '已更新'

  // 获取订单详情用于消息模板
  const orderRes = await db.collection('orders').doc(orderId).get()
  const order = orderRes.data

  if (!order) return

  const templateData = {
    thing1: { value: statusText }, // 订单状态
    thing2: { value: order.orderNo || orderId }, // 订单号
    thing3: { value: tableNumber ? `${tableNumber}号桌` : '外卖订单' }, // 桌号/配送类型
    time4: { value: formatTime(new Date()) } // 更新时间
  }

  // 注意：需要在微信公众平台配置订阅消息模板
  // 模板 ID 需要根据实际情况配置
  // 这里仅作为示例，实际使用需要替换为真实的模板 ID
  /*
  await cloud.openapi.subscribeMessage.send({
    touser: userOpenid,
    templateId: 'YOUR_TEMPLATE_ID',
    data: templateData,
    page: '/pages/order/orderDetail/orderDetail?id=' + orderId
  })
  */

  console.log(`订单 ${orderId} 状态已更新为 ${statusText}，可发送订阅消息通知`)
}

// 格式化时间
function formatTime(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${year}-${month}-${day} ${hours}:${minutes}`
}