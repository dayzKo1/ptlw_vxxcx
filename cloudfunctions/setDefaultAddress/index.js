const cloud = require('wx-server-sdk')
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID
  const { addressId } = event

  if (!addressId) {
    return {
      success: false,
      message: '缺少地址ID'
    }
  }

  try {
    // 验证地址所有权
    const addressRes = await db.collection('addresses').doc(addressId).get()
    
    if (!addressRes.data) {
      return {
        success: false,
        message: '地址不存在'
      }
    }

    if (addressRes.data.openid !== openid) {
      return {
        success: false,
        message: '无权限修改该地址'
      }
    }

    await db.collection('addresses')
      .where({ openid: openid, isDefault: true })
      .update({
        data: { isDefault: false }
      })

    await db.collection('addresses').doc(addressId).update({
      data: {
        isDefault: true,
        updateTime: new Date().getTime()
      }
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