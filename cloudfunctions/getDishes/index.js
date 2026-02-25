const cloud = require('wx-server-sdk')
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

exports.main = async (event, context) => {
  const { categoryId, status = 1 } = event

  try {
    let query = db.collection('dishes').where({ status: parseInt(status) })
    
    if (categoryId) {
      query = query.where({ categoryId })
    }

    const res = await query.orderBy('sort', 'asc').get()

    return {
      success: true,
      dishes: res.data
    }
  } catch (err) {
    console.error('获取菜品列表失败', err)
    return {
      success: false,
      message: '获取菜品列表失败'
    }
  }
}
