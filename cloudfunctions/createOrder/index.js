const cloud = require('wx-server-sdk')
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const { tableNumber, items, totalPrice, remark, deliveryMode, addressId } = event

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
      updateTime: new Date().getTime()
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