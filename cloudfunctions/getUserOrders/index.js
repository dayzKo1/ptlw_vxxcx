const cloud = require('wx-server-sdk')
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const _ = db.command

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID
  const { status, page = 1, pageSize = 10 } = event

  try {
    let statusCondition = {}
    if (status !== undefined && status !== null && status !== -1) {
      if (Array.isArray(status)) {
        statusCondition = { status: _.in(status) }
      } else {
        statusCondition = { status }
      }
    }

    const query = db.collection('orders')
      .where({
        _openid: openid,
        ...statusCondition
      })
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
    console.error('获取用户订单失败', err)
    return {
      success: false,
      message: '获取订单失败'
    }
  }
}