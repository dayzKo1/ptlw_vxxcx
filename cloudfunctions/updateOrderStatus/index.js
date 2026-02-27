const cloud = require('wx-server-sdk')
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

// 订单状态文本映射
const STATUS_TEXT = {
  1: '待接单',
  2: '制作中',
  3: '已出餐',
  4: '已完成',
  5: '已取消'
}

// 允许的状态转换
const VALID_TRANSITIONS = {
  1: [2, 5],  // 待接单 -> 制作中 或 已取消
  2: [3, 5],  // 制作中 -> 已出餐 或 已取消
  3: [4],     // 已出餐 -> 已完成
  4: [],      // 已完成 -> 无
  5: []       // 已取消 -> 无
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
    const currentStatus = order.status
    const userOpenid = order._openid

    // 验证状态转换是否合法（跳过待支付状态的特殊处理）
    if (currentStatus !== 0 && VALID_TRANSITIONS[currentStatus]) {
      if (!VALID_TRANSITIONS[currentStatus].includes(status)) {
        return {
          success: false,
          message: `订单状态不允许从"${STATUS_TEXT[currentStatus]}"变为"${STATUS_TEXT[status]}"`
        }
      }
    }

    // 更新订单状态
    const updateData = {
      status: status,
      updateTime: new Date().getTime()
    }

    // 如果是接单操作，记录接单时间
    if (status === 2 && currentStatus === 1) {
      updateData.acceptTime = new Date().getTime()
    }

    // 如果是出餐操作，记录出餐时间
    if (status === 3 && currentStatus === 2) {
      updateData.serveTime = new Date().getTime()
    }

    await db.collection('orders').doc(orderId).update({
      data: updateData
    })

    // 发送订阅消息通知（如果用户已订阅）
    if (userOpenid && STATUS_TEXT[status]) {
      try {
        await sendOrderStatusNotification(userOpenid, orderId, status, order)
      } catch (notifyErr) {
        console.error('发送通知失败', notifyErr)
        // 通知失败不影响订单更新
      }
    }

    return {
      success: true,
      message: '订单状态更新成功',
      data: { status, statusText: STATUS_TEXT[status] }
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
async function sendOrderStatusNotification(userOpenid, orderId, status, order) {
  const statusText = STATUS_TEXT[status] || '已更新'

  const tableNumber = order.tableNumber
  const orderNo = order.orderNo || orderId

  // 构建桌号/订单类型描述
  let orderTypeDesc = '外卖订单'
  if (order.orderType === 'T') {
    orderTypeDesc = `${tableNumber}号桌`
  } else if (order.orderType === 'P') {
    orderTypeDesc = '自取订单'
  }

  const templateData = {
    thing1: { value: statusText },
    thing2: { value: orderNo },
    thing3: { value: orderTypeDesc },
    time4: { value: formatTime(new Date()) }
  }

  // 注意：需要在微信公众平台配置订阅消息模板
  console.log(`订单 ${orderNo} 状态已更新为 ${statusText}，可发送订阅消息通知`)
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