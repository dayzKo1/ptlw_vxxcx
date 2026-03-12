const cloud = require('wx-server-sdk')
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

/**
 * ========== 支付配置说明 ==========
 * 
 * 使用微信支付功能前，请完成以下配置：
 * 
 * 1. 申请微信支付商户号
 *    - 访问 https://pay.weixin.qq.com/ 注册商户账号
 *    - 提交营业执照、身份证等材料
 *    - 等待审核通过（1-3个工作日）
 * 
 * 2. 关联小程序和商户号
 *    - 登录微信公众平台 https://mp.weixin.qq.com/
 *    - 进入"功能" -> "微信支付"
 *    - 关联你的商户号
 * 
 * 3. 配置云支付
 *    - 进入云开发控制台
 *    - 点击"设置" -> "微信支付配置"
 *    - 填写商户号和商户密钥（API密钥）
 *    - 配置支付回调函数为 paymentCallback
 * 
 * 4. 修改下方 MCH_ID 为你的商户号
 *    - 商户号格式通常为：16xxxxx（10位数字）
 *    - 可在微信支付商户平台查看
 * 
 * ========== 配置区域 ==========
 */
const MCH_ID = 'YOUR_MCH_ID'  // TODO: 请替换为你的微信支付商户号
// ================================

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID
  const { orderId } = event

  if (!orderId) {
    return {
      success: false,
      message: '缺少订单ID'
    }
  }

  // 检查商户号配置
  if (MCH_ID === 'YOUR_MCH_ID') {
    return {
      success: false,
      message: '支付功能未配置，请联系商家或查看 cloudfunctions/createPayment/index.js 配置说明'
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

    // 验证订单所有权
    if (order._openid !== openid) {
      return {
        success: false,
        message: '无权限支付该订单'
      }
    }

    if (order.status !== 0) {
      return {
        success: false,
        message: '订单状态不正确'
      }
    }

    // 构建订单描述
    let body = '点餐订单'
    if (order.orderType === 'T' && order.tableNumber) {
      body = `堂食-${order.tableNumber}号桌`
    } else if (order.orderType === 'P') {
      body = '自取订单'
    } else if (order.orderType === 'D') {
      body = '外卖订单'
    }

    const payment = await cloud.cloudPay.unifiedOrder({
      body: body,
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
      message: '创建支付失败，请稍后重试'
    }
  }
}