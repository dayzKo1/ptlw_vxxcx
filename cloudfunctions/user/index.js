/**
 * 用户服务云函数
 * 整合：login, addMerchantWhitelist
 */

const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()

exports.main = async (event, context) => {
  const { action } = event

  switch (action) {
    case 'login':
      return await login(event, context)
    case 'addMerchant':
      return await addMerchant(event, context)
    case 'checkMerchant':
      return await checkMerchant(event, context)
    default:
      return { success: false, message: '未知操作' }
  }
}

// 用户登录
async function login(event, context) {
  const wxContext = cloud.getWXContext()
  const { userInfo } = event
  const openid = wxContext.OPENID

  if (!openid) {
    return { success: false, error: '获取用户标识失败' }
  }

  try {
    await ensureCollection('users')
    await ensureCollection('merchantWhitelist')

    // 检查商户白名单
    const whitelistRes = await db.collection('merchantWhitelist')
      .where({ openid, status: 1 })
      .get()

    const isMerchant = whitelistRes.data.length > 0
    const role = isMerchant ? 'merchant' : 'customer'

    // 查询或创建用户
    const userRes = await db.collection('users').where({ openid }).get()

    if (userRes.data.length === 0) {
      // 创建新用户
      await db.collection('users').add({
        data: {
          openid,
          nickName: userInfo?.nickName || '微信用户',
          avatarUrl: userInfo?.avatarUrl || '',
          gender: userInfo?.gender || 0,
          role,
          lastLoginTime: Date.now(),
          createTime: Date.now(),
          updateTime: Date.now()
        }
      })
    } else {
      // 更新用户信息
      const existingUser = userRes.data[0]
      
      // 同步角色（以白名单为准）
      await db.collection('users').where({ openid }).update({
        data: {
          nickName: userInfo?.nickName || existingUser.nickName,
          avatarUrl: userInfo?.avatarUrl || existingUser.avatarUrl,
          role,  // 同步角色
          lastLoginTime: Date.now(),
          updateTime: Date.now()
        }
      })

      // 如果白名单有但 users 表不是商户，同步
      if (isMerchant && existingUser.role !== 'merchant') {
        console.log(`同步用户角色: ${openid} -> merchant`)
      }
    }

    return { 
      success: true, 
      data: { 
        openid, 
        role,
        isMerchant,
        nickName: userInfo?.nickName || '微信用户',
        avatarUrl: userInfo?.avatarUrl || ''
      } 
    }
  } catch (err) {
    console.error('登录失败', err)
    return { success: false, error: err.message || '登录失败' }
  }
}

// 添加商户
async function addMerchant(event, context) {
  const wxContext = cloud.getWXContext()
  const { openid: targetOpenid } = event

  // 验证权限
  const whitelistRes = await db.collection('merchantWhitelist')
    .where({ openid: wxContext.OPENID, status: 1 })
    .get()

  if (whitelistRes.data.length === 0) {
    return { success: false, message: '无权限操作' }
  }

  try {
    await db.collection('merchantWhitelist').add({
      data: {
        openid: targetOpenid,
        status: 1,
        createTime: Date.now()
      }
    })
    return { success: true, message: '添加成功' }
  } catch (err) {
    return { success: false, message: '添加失败' }
  }
}

// 检查商户权限
async function checkMerchant(event, context) {
  const wxContext = cloud.getWXContext()
  const whitelistRes = await db.collection('merchantWhitelist')
    .where({ openid: wxContext.OPENID, status: 1 })
    .get()

  return {
    success: true,
    isMerchant: whitelistRes.data.length > 0
  }
}

// 确保集合存在
async function ensureCollection(name) {
  try {
    await db.collection(name).limit(1).get()
  } catch (err) {
    if (err.errMsg?.includes('collection')) {
      await db.createCollection(name)
    }
  }
}