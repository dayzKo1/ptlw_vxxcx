const cloud = require('wx-server-sdk')
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

exports.main = async (event, context) => {
  const { orderId, remark } = event

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
        remark: remark,
        updateTime: new Date().getTime()
      }
    })

    return {
      success: true,
      message: '订单备注更新成功'
    }
  } catch (err) {
    console.error('更新订单备注失败', err)
    return {
      success: false,
      message: '更新订单备注失败'
    }
  }
}
