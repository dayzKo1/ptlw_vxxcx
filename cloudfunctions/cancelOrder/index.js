const cloud = require('wx-server-sdk')
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

exports.main = async (event, context) => {
  const { orderId } = event

  try {
    await db.collection('orders').doc(orderId).update({
      data: {
        status: 4,
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