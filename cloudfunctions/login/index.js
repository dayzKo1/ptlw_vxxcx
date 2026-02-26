const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

exports.main = async (event, context) => {
  const { userInfo, role } = event
  const wxContext = cloud.getWXContext()
  
  try {
    const openid = wxContext.OPENID
    const sessionKey = wxContext.SESSION_KEY
    
    const userRes = await db.collection('users').where({
      openid: openid
    }).get()
    
    if (userRes.data.length === 0) {
      await db.collection('users').add({
        data: {
          openid: openid,
          nickName: userInfo.nickName,
          avatarUrl: userInfo.avatarUrl,
          gender: userInfo.gender,
          language: userInfo.language,
          city: userInfo.city,
          province: userInfo.province,
          country: userInfo.country,
          role: role || 'customer',
          createTime: db.serverDate(),
          updateTime: db.serverDate()
        }
      })
    } else {
      const updateData = {
        nickName: userInfo.nickName,
        avatarUrl: userInfo.avatarUrl,
        updateTime: db.serverDate()
      }
      if (role) {
        updateData.role = role
      }
      await db.collection('users').where({
        openid: openid
      }).update({
        data: updateData
      })
    }
    
    const userData = userRes.data.length > 0 ? userRes.data[0] : null
    
    return {
      success: true,
      data: {
        openid: openid,
        sessionKey: sessionKey,
        role: role || (userData ? userData.role : 'customer') || 'customer'
      }
    }
  } catch (err) {
    console.error('登录失败', err)
    return {
      success: false,
      error: err.message
    }
  }
}