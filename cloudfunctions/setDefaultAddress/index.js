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

    const defaultRes = await db.collection('addresses')
      .where({ openid: openid, isDefault: true })
      .update({
        data: { isDefault: false }
      })

    await db.collection('addresses').doc(addressId).update({
      data: { isDefault: true }
    })

    return {
      success: true,
      message: '设置默认地址成功'
    }
  } catch (err) {
    console.error('设置默认地址失败', err)
    return {
      success: false,
      message: '设置默认地址失败'
    }
  }
}
