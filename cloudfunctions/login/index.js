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

  console.log('登录请求参数:', JSON.stringify(userInfo))
  console.log('wxContext:', JSON.stringify({
    OPENID: wxContext.OPENID,
    APPID: wxContext.APPID,
    ENV: wxContext.ENV
  }))

  // 检查 openid 是否获取成功
  if (!wxContext.OPENID) {
    console.error('获取 OPENID 失败')
    return {
      success: false,
      error: '获取用户标识失败，请检查云开发环境配置'
    }
  }

  const openid = wxContext.OPENID

  try {
    // 确保必要集合存在
    await ensureCollection('users')
    await ensureCollection('merchantWhitelist')

    let role = 'customer'

    // 查询商户白名单
    const whitelistRes = await db.collection('merchantWhitelist').where({
      openid: openid,
      status: 1
    }).get()

    if (whitelistRes.data.length > 0) {
      role = 'merchant'
    } else if (MERCHANT_WHITELIST.includes(openid)) {
      role = 'merchant'
    }

    // 查询或创建用户
    const userRes = await db.collection('users').where({
      openid: openid
    }).get()

    if (userRes.data.length === 0) {
      // 创建新用户
      await db.collection('users').add({
        data: {
          openid: openid,
          nickName: userInfo?.nickName || '微信用户',
          avatarUrl: userInfo?.avatarUrl || '',
          gender: userInfo?.gender || 0,
          language: userInfo?.language || 'zh_CN',
          city: userInfo?.city || '',
          province: userInfo?.province || '',
          country: userInfo?.country || '中国',
          role: role,
          createTime: db.serverDate(),
          updateTime: db.serverDate()
        }
      })
      console.log('创建新用户成功, openid:', openid)
    } else {
      // 更新现有用户
      const existingUser = userRes.data[0]
      if (existingUser.role === 'merchant') {
        role = 'merchant'
      }

      await db.collection('users').where({
        openid: openid
      }).update({
        data: {
          nickName: userInfo?.nickName || existingUser.nickName,
          avatarUrl: userInfo?.avatarUrl || existingUser.avatarUrl,
          role: role,
          updateTime: db.serverDate()
        }
      })
      console.log('更新用户成功, openid:', openid)
    }

    return {
      success: true,
      data: {
        openid: openid,
        role: role
      }
    }
  } catch (err) {
    console.error('登录失败', err)
    return {
      success: false,
      error: err.message || '登录失败',
      detail: err.toString()
    }
  }
}

// 确保集合存在
async function ensureCollection(collectionName) {
  try {
    await db.collection(collectionName).limit(1).get()
  } catch (err) {
    if (err.errMsg && err.errMsg.includes('collection')) {
      console.log(`集合 ${collectionName} 不存在，尝试创建...`)
      try {
        await db.createCollection(collectionName)
        console.log(`集合 ${collectionName} 创建成功`)
      } catch (createErr) {
        console.error(`创建集合 ${collectionName} 失败:`, createErr)
        throw new Error(`数据库集合 ${collectionName} 不存在且无法创建，请手动在云开发控制台创建`)
      }
    }
  }
}