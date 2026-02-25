const cloud = require('wx-server-sdk')
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

exports.main = async (event, context) => {
  const { orderId } = event

  try {
    const orderRes = await db.collection('orders').doc(orderId).get()
    const order = orderRes.data

    if (!order) {
      return {
        success: false,
        message: '订单不存在'
      }
    }

    await db.collection('orders').doc(orderId).update({
      data: {
        status: 2,
        updateTime: new Date().getTime()
      }
    })

    return {
      success: true,
      message: '订单已出餐'
    }
  } catch (err) {
    console.error('订单出餐失败', err)
    return {
      success: false,
      message: '订单出餐失败'
    }
  }
}
