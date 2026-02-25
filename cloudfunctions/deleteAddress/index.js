const cloud = require('wx-server-sdk')
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const { addressId } = event

  try {
    const openid = wxContext.OPENID

    await db.collection('addresses').doc(addressId).remove()

    return {
      success: true,
      message: '删除地址成功'
    }
  } catch (err) {
    console.error('删除地址失败', err)
    return {
      success: false,
      message: '删除地址失败'
    }
  }
}
