const cloud = require('wx-server-sdk')
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const { addressId, name, phone, province, city, district, detail, isDefault = false } = event

  try {
    const openid = wxContext.OPENID

    if (isDefault) {
      await db.collection('addresses')
        .where({ openid: openid, isDefault: true })
        .update({
          data: { isDefault: false }
        })
    }

    await db.collection('addresses').doc(addressId).update({
      data: {
        name: name,
        phone: phone,
        province: province,
        city: city,
        district: district,
        detail: detail,
        isDefault: isDefault,
        updateTime: new Date().getTime()
      }
    })

    return {
      success: true,
      message: '更新地址成功'
    }
  } catch (err) {
    console.error('更新地址失败', err)
    return {
      success: false,
      message: '更新地址失败'
    }
  }
}
