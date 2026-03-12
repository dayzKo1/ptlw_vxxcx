/**
 * 定时取消超时未支付订单
 * 需要在云开发控制台配置定时触发器
 * 建议每5分钟执行一次
 */

const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const _ = db.command

// 超时时间（毫秒）- 15分钟
const TIMEOUT = 15 * 60 * 1000

exports.main = async (event, context) => {
  try {
    const now = Date.now()
    const timeoutThreshold = now - TIMEOUT

    // 查询超时未支付订单
    const result = await db.collection('orders')
      .where({
        status: 0, // 待支付
        createTime: _.lt(timeoutThreshold) // 创建时间超过15分钟
      })
      .get()

    const timeoutOrders = result.data

    if (timeoutOrders.length === 0) {
      return {
        success: true,
        message: '没有超时订单',
        cancelledCount: 0
      }
    }

    // 批量取消订单
    const cancelPromises = timeoutOrders.map(order => {
      return db.collection('orders')
        .doc(order._id)
        .update({
          data: {
            status: 5, // 已取消
            cancelReason: '超时未支付，系统自动取消',
            cancelTime: now
          }
        })
    })

    await Promise.all(cancelPromises)

    // 如果是桌号订单，需要释放桌号
    const tableOrders = timeoutOrders.filter(o => o.orderType === 'T' && o.tableId)
    
    for (const order of tableOrders) {
      // 检查是否还有其他订单使用该桌号
      const otherOrders = await db.collection('orders')
        .where({
          tableId: order.tableId,
          status: _.in([1, 2, 3]), // 待接单、制作中、已出餐
          _id: _.neq(order._id)
        })
        .count()

      if (otherOrders.total === 0) {
        // 没有其他订单，释放桌号
        await db.collection('tables')
          .doc(order.tableId)
          .update({
            data: {
              status: 0, // 空闲
              currentOrderId: _.remove()
            }
          })
      }
    }

    return {
      success: true,
      message: `成功取消 ${timeoutOrders.length} 个超时订单`,
      cancelledCount: timeoutOrders.length,
      cancelledOrders: timeoutOrders.map(o => o._id)
    }
  } catch (err) {
    console.error('取消超时订单失败', err)
    return {
      success: false,
      message: err.message || '取消超时订单失败',
      error: err
    }
  }
}