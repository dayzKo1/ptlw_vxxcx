const cloud = require('wx-server-sdk')
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

// 订单超时时间（15 分钟）
const ORDER_TIMEOUT = 15 * 60 * 1000

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const { tableNumber, items, totalPrice, remark, deliveryMode, addressId } = event

  // 参数验证
  if (!items || !Array.isArray(items) || items.length === 0) {
    return { success: false, message: '购物车为空' }
  }

  if (!totalPrice || totalPrice <= 0) {
    return { success: false, message: '订单金额异常' }
  }

  // 检查营业时间
  const shopInfoRes = await db.collection('shopInfo').limit(1).get()
  if (shopInfoRes.data.length > 0) {
    const shopInfo = shopInfoRes.data[0]
    if (shopInfo.businessHours) {
      const now = new Date()
      const currentMinutes = now.getHours() * 60 + now.getMinutes()
      const [openTime, closeTime] = shopInfo.businessHours.split('-')
      if (openTime && closeTime) {
        const [openHour, openMin] = openTime.split(':').map(Number)
        const [closeHour, closeMin] = closeTime.split(':').map(Number)
        const openMinutes = openHour * 60 + openMin
        const closeMinutes = closeHour * 60 + closeMin
        
        if (currentMinutes < openMinutes || currentMinutes > closeMinutes) {
          return { 
            success: false, 
            message: `当前不在营业时间内，营业时间为 ${shopInfo.businessHours}`
          }
        }
      }
    }
  }

  try {
    const orderNo = generateOrderNo()

    const orderData = {
      _openid: wxContext.OPENID,
      orderNo,
      tableNumber,
      items,
      totalPrice,
      remark,
      deliveryMode: deliveryMode || 'pickup',
      addressId: addressId || '',
      status: 0,
      createTime: new Date().getTime(),
      updateTime: new Date().getTime(),
      timeoutAt: new Date().getTime() + ORDER_TIMEOUT
    }

    const res = await db.collection('orders').add({
      data: orderData
    })

    return {
      success: true,
      orderId: res._id,
      orderNo
    }
  } catch (err) {
    console.error('创建订单失败', err)
    return {
      success: false,
      message: '创建订单失败'
    }
  }
}

function generateOrderNo() {
  const now = new Date()
  const year = now.getFullYear()
  const month = (now.getMonth() + 1).toString().padStart(2, '0')
  const day = now.getDate().toString().padStart(2, '0')
  const hour = now.getHours().toString().padStart(2, '0')
  const minute = now.getMinutes().toString().padStart(2, '0')
  const second = now.getSeconds().toString().padStart(2, '0')
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
  return `${year}${month}${day}${hour}${minute}${second}${random}`
}