const cloud = require('wx-server-sdk')
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

exports.main = async (event, context) => {
  const { status = 1 } = event

  try {
    const res = await db.collection('categories')
      .where({ status: parseInt(status) })
      .orderBy('sort', 'asc')
      .get()

    return {
      success: true,
      categories: res.data
    }
  } catch (err) {
    console.error('获取分类列表失败', err)
    return {
      success: false,
      message: '获取分类列表失败'
    }
  }
}
