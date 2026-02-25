const cloud = require('wx-server-sdk')
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()

  try {
    const openid = wxContext.OPENID

    const res = await db.collection('addresses')
      .where({ openid: openid })
      .orderBy('isDefault', 'desc')
      .orderBy('createTime', 'desc')
      .get()

    return {
      success: true,
      addresses: res.data
    }
  } catch (err) {
    console.error('获取地址列表失败', err)
    return {
      success: false,
      message: '获取地址列表失败'
    }
  }
}
