const cloud = require('wx-server-sdk')
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const { page = 1, pageSize = 20 } = event

  try {
    const openid = wxContext.OPENID

    const res = await db.collection('favorites')
      .where({ openid: openid })
      .orderBy('createTime', 'desc')
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .get()

    const countRes = await db.collection('favorites')
      .where({ openid: openid })
      .count()

    return {
      success: true,
      favorites: res.data,
      total: countRes.total,
      page,
      pageSize
    }
  } catch (err) {
    console.error('获取收藏列表失败', err)
    return {
      success: false,
      message: '获取收藏列表失败'
    }
  }
}
