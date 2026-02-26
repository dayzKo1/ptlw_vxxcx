const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

const MERCHANT_WHITELIST = [
  // 在此添加商户白名单 openid
  // 示例: 'oXXXX-xxxxxxxxxxxxxxxx'
]

exports.main = async (event, context) => {
  const { userInfo } = event
  const wxContext = cloud.getWXContext()
  
  try {
    const openid = wxContext.OPENID
    const sessionKey = wxContext.SESSION_KEY
    
    let role = 'customer'
    
    const whitelistRes = await db.collection('merchantWhitelist').where({
      openid: openid,
      status: 1
    }).get()
    
    if (whitelistRes.data.length > 0) {
      role = 'merchant'
    } else if (MERCHANT_WHITELIST.includes(openid)) {
      role = 'merchant'
    }
    
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
          role: role,
          createTime: db.serverDate(),
          updateTime: db.serverDate()
        }
      })
    } else {
      const existingUser = userRes.data[0]
      if (existingUser.role === 'merchant') {
        role = 'merchant'
      }
      
      await db.collection('users').where({
        openid: openid
      }).update({
        data: {
          nickName: userInfo.nickName,
          avatarUrl: userInfo.avatarUrl,
          role: role,
          updateTime: db.serverDate()
        }
      })
    }
    
    return {
      success: true,
      data: {
        openid: openid,
        sessionKey: sessionKey,
        role: role
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