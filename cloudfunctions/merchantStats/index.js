const cloud = require('wx-server-sdk')
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const _ = db.command

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const { type } = event

  // 验证商户权限
  const whitelist = await db.collection('merchantWhitelist')
    .where({ openid: wxContext.OPENID, status: 1 })
    .get()

  if (whitelist.data.length === 0) {
    return { success: false, message: '无权限访问' }
  }

  switch (type) {
    case 'overview':
      return await getOverviewStats(wxContext)
    case 'daily':
      return await getDailyStats(event.date, wxContext)
    case 'weekly':
      return await getWeeklyStats(wxContext)
    case 'monthly':
      return await getMonthlyStats(wxContext)
    case 'dishRanking':
      return await getDishRanking(event.limit || 10, wxContext)
    default:
      return { success: false, message: '未知统计类型' }
  }
}

// 获取概览统计（今日数据）
async function getOverviewStats(wxContext) {
  try {
    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
    const todayEnd = todayStart + 24 * 60 * 60 * 1000

    // 今日订单统计
    const todayOrdersRes = await db.collection('orders')
      .where({
        createTime: _.gte(todayStart).lt(todayEnd),
        status: _.neq(4) // 排除已取消
      })
      .get()

    // 今日收入（已完成订单）
    const todayIncomeRes = await db.collection('orders')
      .where({
        createTime: _.gte(todayStart).lt(todayEnd),
        status: 3 // 已完成
      })
      .get()

    // 待处理订单
    const pendingOrdersRes = await db.collection('orders')
      .where({
        status: 1 // 制作中
      })
      .get()

    // 菜品统计
    const dishesRes = await db.collection('dishes')
      .where({ status: 1 }) // 上架中
      .get()

    // 桌号统计
    const tablesRes = await db.collection('tables').get()
    const activeTables = tablesRes.data.filter(t => t.status === 1)

    const todayOrders = todayOrdersRes.data.length
    const todayIncome = todayIncomeRes.data.reduce((sum, order) => sum + (order.totalPrice || 0), 0)
    const pendingOrders = pendingOrdersRes.data.length
    const dishCount = dishesRes.data.length

    return {
      success: true,
      data: {
        todayOrders,
        todayIncome: todayIncome.toFixed(2),
        pendingOrders,
        dishCount,
        onlineDishCount: dishCount,
        tableCount: tablesRes.data.length,
        activeTableCount: activeTables.length
      },
      message: '获取成功'
    }
  } catch (err) {
    console.error('获取概览统计失败', err)
    return { success: false, message: '获取统计失败' }
  }
}

// 获取每日统计
async function getDailyStats(date, wxContext) {
  try {
    const targetDate = date ? new Date(date) : new Date()
    const dayStart = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate()).getTime()
    const dayEnd = dayStart + 24 * 60 * 60 * 1000

    const ordersRes = await db.collection('orders')
      .where({
        createTime: _.gte(dayStart).lt(dayEnd),
        status: _.neq(4)
      })
      .get()

    const incomeRes = await db.collection('orders')
      .where({
        createTime: _.gte(dayStart).lt(dayEnd),
        status: 3
      })
      .get()

    const orders = ordersRes.data
    const income = incomeRes.data.reduce((sum, order) => sum + (order.totalPrice || 0), 0)

    // 按小时统计
    const hourlyStats = {}
    for (let i = 0; i < 24; i++) {
      hourlyStats[i] = { orders: 0, income: 0 }
    }

    orders.forEach(order => {
      const hour = new Date(order.createTime).getHours()
      hourlyStats[hour].orders += 1
      if (order.status === 3) {
        hourlyStats[hour].income += order.totalPrice || 0
      }
    })

    return {
      success: true,
      data: {
        date: targetDate.toISOString().split('T')[0],
        totalOrders: orders.length,
        totalIncome: income.toFixed(2),
        hourlyStats: Object.keys(hourlyStats).map(key => ({
          hour: key,
          orders: hourlyStats[key].orders,
          income: hourlyStats[key].income.toFixed(2)
        }))
      },
      message: '获取成功'
    }
  } catch (err) {
    console.error('获取每日统计失败', err)
    return { success: false, message: '获取统计失败' }
  }
}

// 获取每周统计
async function getWeeklyStats(wxContext) {
  try {
    const now = new Date()
    const dayOfWeek = now.getDay() || 7 // 周日为 0，转为 7
    const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - dayOfWeek + 1)
    weekStart.setHours(0, 0, 0, 0)
    const weekStartTime = weekStart.getTime()

    const ordersRes = await db.collection('orders')
      .where({
        createTime: _.gte(weekStartTime),
        status: _.neq(4)
      })
      .get()

    const incomeRes = await db.collection('orders')
      .where({
        createTime: _.gte(weekStartTime),
        status: 3
      })
      .get()

    const orders = ordersRes.data
    const income = incomeRes.data.reduce((sum, order) => sum + (order.totalPrice || 0), 0)

    // 按天统计
    const dailyStats = []
    for (let i = 0; i < 7; i++) {
      const date = new Date(weekStartTime + i * 24 * 60 * 60 * 1000)
      const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime()
      const dayEnd = dayStart + 24 * 60 * 60 * 1000

      const dayOrders = orders.filter(o => o.createTime >= dayStart && o.createTime < dayEnd)
      const dayIncome = dayOrders
        .filter(o => o.status === 3)
        .reduce((sum, o) => sum + (o.totalPrice || 0), 0)

      dailyStats.push({
        date: date.toISOString().split('T')[0],
        dayName: ['一', '二', '三', '四', '五', '六', '日'][i],
        orders: dayOrders.length,
        income: dayIncome.toFixed(2)
      })
    }

    return {
      success: true,
      data: {
        weekStart: weekStart.toISOString().split('T')[0],
        totalOrders: orders.length,
        totalIncome: income.toFixed(2),
        dailyStats
      },
      message: '获取成功'
    }
  } catch (err) {
    console.error('获取每周统计失败', err)
    return { success: false, message: '获取统计失败' }
  }
}

// 获取每月统计
async function getMonthlyStats(wxContext) {
  try {
    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime()
    const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1).getTime()

    const ordersRes = await db.collection('orders')
      .where({
        createTime: _.gte(monthStart).lt(nextMonthStart),
        status: _.neq(4)
      })
      .get()

    const incomeRes = await db.collection('orders')
      .where({
        createTime: _.gte(monthStart).lt(nextMonthStart),
        status: 3
      })
      .get()

    const orders = ordersRes.data
    const income = incomeRes.data.reduce((sum, order) => sum + (order.totalPrice || 0), 0)

    return {
      success: true,
      data: {
        month: now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0'),
        totalOrders: orders.length,
        totalIncome: income.toFixed(2)
      },
      message: '获取成功'
    }
  } catch (err) {
    console.error('获取每月统计失败', err)
    return { success: false, message: '获取统计失败' }
  }
}

// 获取菜品排行
async function getDishRanking(limit, wxContext) {
  try {
    const ordersRes = await db.collection('orders')
      .where({
        status: _.neq(4)
      })
      .orderBy('createTime', 'desc')
      .limit(1000)
      .get()

    // 统计菜品销量
    const dishSales = {}
    ordersRes.data.forEach(order => {
      if (order.items && Array.isArray(order.items)) {
        order.items.forEach(item => {
          const dishId = item.dishId || item._id
          if (!dishSales[dishId]) {
            dishSales[dishId] = {
              dishId,
              name: item.name,
              price: item.price,
              image: item.image,
              sales: 0
            }
          }
          dishSales[dishId].sales += item.number || 1
        })
      }
    })

    // 转为数组并排序
    const ranking = Object.values(dishSales)
      .sort((a, b) => b.sales - a.sales)
      .slice(0, limit)

    return {
      success: true,
      data: ranking,
      message: '获取成功'
    }
  } catch (err) {
    console.error('获取菜品排行失败', err)
    return { success: false, message: '获取排行失败' }
  }
}
