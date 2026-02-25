const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

exports.main = async (event, context) => {
  const { userInfo } = event
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
          createTime: db.serverDate(),
          updateTime: db.serverDate()
        }
      })
    } else {
      await db.collection('users').where({
        openid: openid
      }).update({
        data: {
          nickName: userInfo.nickName,
          avatarUrl: userInfo.avatarUrl,
          updateTime: db.serverDate()
        }
      })
    }
    
    return {
      success: true,
      data: {
        openid: openid,
        sessionKey: sessionKey
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