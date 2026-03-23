/**
 * 商家统计云函数
 */

const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()
const _ = db.command

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()

  // 验证权限
  const whitelistRes = await db.collection('merchantWhitelist')
    .where({ openid: wxContext.OPENID, status: 1 })
    .get()

  if (whitelistRes.data.length === 0) {
    return { success: false, message: '无权限' }
  }

  try {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayTimestamp = today.getTime()

    // 今日订单数
    const todayOrdersRes = await db.collection('orders')
      .where({ createTime: _.gte(todayTimestamp) })
      .count()

    // 今日收入
    const todayIncomeRes = await db.collection('orders')
      .where({
        createTime: _.gte(todayTimestamp),
        status: _.gte(1)
      })
      .get()

    const todayIncome = todayIncomeRes.data.reduce((sum, order) => sum + (order.totalPrice || 0), 0)

    // 待处理订单
    const pendingOrdersRes = await db.collection('orders')
      .where({ status: _.in([0, 1]) })
      .count()

    // 菜品统计
    const dishesRes = await db.collection('dishes').get()
    const dishCount = dishesRes.data.length
    const onlineDishCount = dishesRes.data.filter(d => d.status === 1).length

    // 桌号统计
    const tablesRes = await db.collection('tables').get()
    const tableCount = tablesRes.data.length
    const activeTableCount = tablesRes.data.filter(t => t.status === 1).length

    return {
      success: true,
      data: {
        todayOrders: todayOrdersRes.total,
        todayIncome,
        pendingOrders: pendingOrdersRes.total,
        dishCount,
        onlineDishCount,
        tableCount,
        activeTableCount
      }
    }
  } catch (err) {
    console.error('获取统计失败', err)
    return { success: false, message: '获取统计失败' }
  }
}