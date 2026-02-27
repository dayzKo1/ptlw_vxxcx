const cloud = require('wx-server-sdk')
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const _ = db.command

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID
  const { status, page = 1, pageSize = 50 } = event

  // 验证商户权限
  const whitelistRes = await db.collection('merchantWhitelist')
    .where({ openid: openid, status: 1 })
    .get()

  if (whitelistRes.data.length === 0) {
    return {
      success: false,
      message: '无权限访问'
    }
  }

  try {
    let statusCondition = {}
    if (status !== undefined && status !== null && status !== -1) {
      statusCondition = { status }
    }

    const query = db.collection('orders')
      .where(statusCondition)
      .orderBy('createTime', 'desc')

    const countRes = await query.count()
    const total = countRes.total

    const res = await query
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .get()

    const orders = res.data.map(order => ({
      ...order,
      orderNo: order.orderNo || (order._id || '').slice(-8)
    }))

    return {
      success: true,
      data: {
        orders,
        total,
        page,
        pageSize,
        hasMore: orders.length === pageSize
      }
    }
  } catch (err) {
    console.error('获取商户订单失败', err)
    return {
      success: false,
      message: '获取订单失败'
    }
  }
}