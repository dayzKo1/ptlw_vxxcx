const cloud = require('wx-server-sdk')
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

// ========== 配置区域 ==========
// 请将下面的 YOUR_MCH_ID 替换为你的微信支付商户号
// 商户号可在微信支付商户平台查看 (https://pay.weixin.qq.com)
const MCH_ID = 'YOUR_MCH_ID'
// =============================

exports.main = async (event, context) => {
  const { orderId } = event

  // 检查商户号配置
  if (MCH_ID === 'YOUR_MCH_ID') {
    return {
      success: false,
      message: '请先配置商户号，请编辑 cloudfunctions/createPayment/index.js 文件'
    }
  }

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
      subMchId: MCH_ID,
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