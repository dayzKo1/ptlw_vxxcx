const cloud = require('wx-server-sdk')
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID
  const { status } = event

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
    let query = db.collection('tables')

    if (status !== undefined && status !== 'all') {
      const statusValue = status === 'occupied' ? 1 : (status === 'idle' ? 0 : parseInt(status))
      query = query.where({ status: statusValue })
    }

    const res = await query.orderBy('tableNumber', 'asc').get()

    return {
      success: true,
      tables: res.data.map(t => ({
        ...t,
        statusText: t.status === 1 ? '使用中' : '空闲'
      }))
    }
  } catch (err) {
    console.error('获取桌号列表失败', err)
    return {
      success: false,
      message: '获取桌号列表失败'
    }
  }
}