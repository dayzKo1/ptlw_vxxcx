const cloud = require('wx-server-sdk')
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const _ = db.command

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID
  const { orderId, cancelReason } = event

  if (!orderId) {
    return {
      success: false,
      message: '缺少订单ID'
    }
  }

  try {
    // 获取订单信息
    const orderRes = await db.collection('orders').doc(orderId).get()
    
    if (!orderRes.data) {
      return {
        success: false,
        message: '订单不存在'
      }
    }

    const order = orderRes.data

    // 验证权限：订单所有者或商户可以取消
    const whitelistRes = await db.collection('merchantWhitelist')
      .where({ openid: openid, status: 1 })
      .get()
    const isMerchant = whitelistRes.data.length > 0

    if (order._openid !== openid && !isMerchant) {
      return {
        success: false,
        message: '无权限取消该订单'
      }
    }

    // 可取消的订单状态
    const cancellableStatus = isMerchant ? [0, 1, 2, 3] : [0, 1]  // 商户可取消更多状态
    const statusText = ['待支付', '待接单', '制作中', '已出餐', '已完成', '已取消', '已退款'][order.status]

    if (!cancellableStatus.includes(order.status)) {
      return {
        success: false,
        message: `当前订单状态为"${statusText}"，不可取消`
      }
    }

    // 如果是已支付订单，需要退款
    if (order.transactionId && order.status >= 1) {
      // 调用退款逻辑
      const refundRes = await cloud.callFunction({
        name: 'refundOrder',
        data: {
          orderId,
          refundReason: cancelReason || '订单取消退款'
        }
      })

      if (!refundRes.result.success) {
        return {
          success: false,
          message: refundRes.result.message || '取消订单失败'
        }
      }

      // 退款成功，订单状态已在 refundOrder 中更新为已退款
      return {
        success: true,
        message: '订单已取消并退款',
        refunded: true
      }
    }

    // 未支付订单，直接取消
    await db.collection('orders').doc(orderId).update({
      data: {
        status: 5,  // 已取消
        cancelReason: cancelReason || (isMerchant ? '商户取消' : '用户取消'),
        cancelTime: new Date().getTime(),
        updateTime: new Date().getTime()
      }
    })

    // 如果是桌号订单，释放桌号
    if (order.orderType === 'T' && order.tableId) {
      // 检查是否还有其他订单使用该桌号
      const otherOrders = await db.collection('orders')
        .where({
          tableId: order.tableId,
          status: _.in([0, 1, 2, 3]),
          _id: _.neq(orderId)
        })
        .count()

      if (otherOrders.total === 0) {
        await db.collection('tables').doc(order.tableId).update({
          data: {
            status: 0,  // 空闲
            currentOrderId: _.remove()
          }
        }).catch(err => console.error('释放桌号失败', err))
      }
    }

    return {
      success: true,
      message: '订单已取消'
    }
  } catch (err) {
    console.error('取消订单失败', err)
    return {
      success: false,
      message: '取消订单失败'
    }
  }
}