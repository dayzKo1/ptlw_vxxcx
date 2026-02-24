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

    if (order.status !== 0) {
      return {
        success: false,
        message: '订单状态不正确'
      }
    }

    const payment = await cloud.cloudPay.unifiedOrder({
      body: `点餐-${order.tableNumber}号桌`,
      outTradeNo: order.orderNo,
      spbillCreateIp: '127.0.0.1',
      subMchId: 'YOUR_MCH_ID',
      totalFee: Math.round(order.totalPrice * 100),
      envId: cloud.DYNAMIC_CURRENT_ENV,
      functionName: 'paymentCallback'
    })

    return {
      success: true,
      payment
    }
  } catch (err) {
    console.error('创建支付失败', err)
    return {
      success: false,
      message: '创建支付失败'
    }
  }
}