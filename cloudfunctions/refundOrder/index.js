/**
 * 商家手动退款云函数
 * 调用微信支付退款接口，适用于已支付订单的退款
 */

const cloud = require('wx-server-sdk')
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const _ = db.command

// 订单状态
const ORDER_STATUS = {
  PENDING: 0,      // 待支付
  WAITING: 1,      // 待接单
  COOKING: 2,      // 制作中
  SERVED: 3,       // 已出餐
  COMPLETED: 4,    // 已完成
  CANCELLED: 5,    // 已取消
  REFUNDED: 6      // 已退款
}

// 可退款的订单状态
const REFUNDABLE_STATUS = [1, 2, 3]  // 待接单、制作中、已出餐

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID
  const { orderId, refundReason, refundAmount } = event

  // 参数验证
  if (!orderId) {
    return { success: false, message: '缺少订单ID' }
  }

  // 验证商户权限
  const whitelistRes = await db.collection('merchantWhitelist')
    .where({ openid: openid, status: 1 })
    .get()

  if (whitelistRes.data.length === 0) {
    return { success: false, message: '无权限操作' }
  }

  try {
    // 获取订单信息
    const orderRes = await db.collection('orders').doc(orderId).get()
    if (!orderRes.data) {
      return { success: false, message: '订单不存在' }
    }

    const order = orderRes.data

    // 验证订单状态是否可退款
    if (!REFUNDABLE_STATUS.includes(order.status)) {
      const statusText = ['待支付', '待接单', '制作中', '已出餐', '已完成', '已取消', '已退款'][order.status]
      return { success: false, message: `订单状态为"${statusText}"，不可退款` }
    }

    // 验证是否已支付
    if (!order.transactionId) {
      return { success: false, message: '订单未支付，无法退款' }
    }

    // 计算退款金额
    const totalFee = Math.round(order.totalPrice * 100)  // 订单总金额（分）
    let refundFee = totalFee  // 默认全额退款

    // 如果指定了部分退款金额
    if (refundAmount && refundAmount > 0 && refundAmount < order.totalPrice) {
      refundFee = Math.round(refundAmount * 100)
    }

    // 生成退款单号
    const outRefundNo = `RF${Date.now()}${Math.random().toString(36).substr(2, 4).toUpperCase()}`

    // 获取商户号配置
    const shopRes = await db.collection('shopInfo').limit(1).get()
    const subMchId = shopRes.data[0]?.mchId || ''

    if (!subMchId) {
      // 如果没有配置商户号，仅更新订单状态（模拟退款，用于测试）
      console.warn('未配置商户号，执行模拟退款')

      await db.collection('orders').doc(orderId).update({
        data: {
          status: ORDER_STATUS.REFUNDED,
          refundTime: new Date().getTime(),
          refundReason: refundReason || '商家退款',
          refundAmount: refundFee / 100,
          outRefundNo,
          updateTime: new Date().getTime()
        }
      })

      // 记录退款日志
      await db.collection('refundLogs').add({
        data: {
          orderId,
          orderNo: order.orderNo,
          outRefundNo,
          transactionId: order.transactionId,
          totalFee,
          refundFee,
          refundReason: refundReason || '商家退款',
          status: 'mock',
          operator: openid,
          createTime: new Date().getTime()
        }
      })

      // 如果是桌号订单，释放桌号
      if (order.orderType === 'T' && order.tableId) {
        await db.collection('tables').doc(order.tableId).update({
          data: {
            status: 0,  // 空闲
            currentOrderId: _.remove()
          }
        }).catch(err => console.error('释放桌号失败', err))
      }

      return {
        success: true,
        message: '退款成功（模拟）',
        data: {
          refundAmount: refundFee / 100,
          outRefundNo
        }
      }
    }

    // 调用微信支付退款接口
    const refundResult = await cloud.cloudPay.refund({
      outTradeNo: order.orderNo,
      outRefundNo: outRefundNo,
      totalFee: totalFee,
      refundFee: refundFee,
      subMchId: subMchId,
      nonceStr: Math.random().toString(36).substr(2, 32)
    })

    if (refundResult.returnCode === 'SUCCESS' && refundResult.resultCode === 'SUCCESS') {
      // 退款成功，更新订单状态
      await db.collection('orders').doc(orderId).update({
        data: {
          status: ORDER_STATUS.REFUNDED,
          refundTime: new Date().getTime(),
          refundReason: refundReason || '商家退款',
          refundAmount: refundFee / 100,
          outRefundNo,
          refundId: refundResult.refundId,
          updateTime: new Date().getTime()
        }
      })

      // 记录退款日志
      await db.collection('refundLogs').add({
        data: {
          orderId,
          orderNo: order.orderNo,
          outRefundNo,
          transactionId: order.transactionId,
          refundId: refundResult.refundId,
          totalFee,
          refundFee,
          refundReason: refundReason || '商家退款',
          status: 'success',
          operator: openid,
          createTime: new Date().getTime()
        }
      })

      // 如果是桌号订单，释放桌号
      if (order.orderType === 'T' && order.tableId) {
        await db.collection('tables').doc(order.tableId).update({
          data: {
            status: 0,  // 空闲
            currentOrderId: _.remove()
          }
        })
      }

      return {
        success: true,
        message: '退款成功',
        data: {
          refundAmount: refundFee / 100,
          outRefundNo,
          refundId: refundResult.refundId
        }
      }
    } else {
      // 退款失败
      console.error('退款失败', refundResult)

      // 记录退款失败日志
      await db.collection('refundLogs').add({
        data: {
          orderId,
          orderNo: order.orderNo,
          outRefundNo,
          transactionId: order.transactionId,
          totalFee,
          refundFee,
          refundReason: refundReason || '商家退款',
          status: 'failed',
          failReason: refundResult.returnMsg || refundResult.errCodeDes || '退款失败',
          operator: openid,
          createTime: new Date().getTime()
        }
      })

      return {
        success: false,
        message: refundResult.returnMsg || refundResult.errCodeDes || '退款失败'
      }
    }
  } catch (err) {
    console.error('退款异常', err)
    return {
      success: false,
      message: err.message || '退款失败，请稍后重试'
    }
  }
}