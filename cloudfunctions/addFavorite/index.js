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

    const favoriteRes = await db.collection('favorites')
      .where({
        openid: openid,
        dishId: dishId
      })
      .get()

    if (favoriteRes.data.length > 0) {
      return {
        success: true,
        isFavorite: true,
        message: '已收藏'
      }
    }

    const dishRes = await db.collection('dishes').doc(dishId).get()
    const dish = dishRes.data

    if (!dish) {
      return {
        success: false,
        message: '菜品不存在'
      }
    }

    await db.collection('favorites').add({
      data: {
        openid: openid,
        dishId: dishId,
        dishName: dish.name,
        dishPrice: dish.price,
        dishImage: dish.image,
        createTime: new Date().getTime()
      }
    })

    return {
      success: true,
      isFavorite: true,
      message: '收藏成功'
    }
  } catch (err) {
    console.error('添加收藏失败', err)
    return {
      success: false,
      message: '添加收藏失败'
    }
  }
}
