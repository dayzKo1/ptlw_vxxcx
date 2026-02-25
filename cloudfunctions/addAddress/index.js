const cloud = require('wx-server-sdk')
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const { name, phone, province, city, district, detail, isDefault = false } = event

  try {
    const openid = wxContext.OPENID

    if (isDefault) {
      await db.collection('addresses')
        .where({ openid: openid, isDefault: true })
        .update({
          data: { isDefault: false }
        })
    }

    const res = await db.collection('addresses').add({
      data: {
        openid: openid,
        name: name,
        phone: phone,
        province: province,
        city: city,
        district: district,
        detail: detail,
        isDefault: isDefault,
        createTime: new Date().getTime(),
        updateTime: new Date().getTime()
      }
    })

    return {
      success: true,
      addressId: res._id,
      message: '添加地址成功'
    }
  } catch (err) {
    console.error('添加地址失败', err)
    return {
      success: false,
      message: '添加地址失败'
    }
  }
}
