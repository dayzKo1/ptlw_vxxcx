const cloud = require('wx-server-sdk')
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const { orderId, status } = event

  if (!orderId || status === undefined) {
    return {
      success: false,
      message: '缺少必要参数'
    }
  }

  try {
    await db.collection('orders').doc(orderId).update({
      data: {
        status: status,
        updateTime: new Date().getTime()
      }
    })

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