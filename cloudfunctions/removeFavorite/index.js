const cloud = require('wx-server-sdk')
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const { dishId } = event

  try {
    const openid = wxContext.OPENID

    const res = await db.collection('favorites')
      .where({
        openid: openid,
        dishId: dishId
      })
      .remove()

    return {
      success: true,
      isFavorite: false,
      message: '取消收藏成功'
    }
  } catch (err) {
    console.error('取消收藏失败', err)
    return {
      success: false,
      message: '取消收藏失败'
    }
  }
}
