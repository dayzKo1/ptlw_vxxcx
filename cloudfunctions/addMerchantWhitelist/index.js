const cloud = require('wx-server-sdk')
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const _ = db.command

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID
  const { nickname, targetOpenid } = event

  try {
    // 检查是否有已存在的商户
    const merchantCount = await db.collection('merchantWhitelist')
      .where({ status: 1 })
      .count()

    // 如果没有任何商户，允许第一个用户成为商户（首次初始化）
    if (merchantCount.total === 0) {
      const result = await addMerchant(openid, nickname || '管理员')
      return {
        success: true,
        message: '首次初始化，已添加为管理员',
        openid: openid,
        isNew: true,
        isFirstMerchant: true
      }
    }

    // 如果已有商户，需要验证调用者是否为商户
    const callerRes = await db.collection('merchantWhitelist')
      .where({
        openid: openid,
        status: 1
      })
      .get()

    if (callerRes.data.length === 0) {
      return {
        success: false,
        message: '无权限：只有商户才能添加新商户',
        code: 'PERMISSION_DENIED'
      }
    }

    // 商户添加新商户
    const targetOpenidToAdd = targetOpenid || openid
    
    // 检查目标用户是否已是商户
    const existRes = await db.collection('merchantWhitelist')
      .where({ openid: targetOpenidToAdd })
      .get()

    if (existRes.data.length > 0) {
      // 更新状态
      await db.collection('merchantWhitelist')
        .where({ openid: targetOpenidToAdd })
        .update({
          data: {
            status: 1,
            nickname: nickname || existRes.data[0].nickname,
            updateTime: Date.now()
          }
        })
      
      return {
        success: true,
        message: '已更新商户状态',
        openid: targetOpenidToAdd,
        isNew: false
      }
    }

    // 添加新商户
    const result = await addMerchant(targetOpenidToAdd, nickname || '商户')
    return {
      success: true,
      message: '已添加到商户白名单',
      openid: targetOpenidToAdd,
      isNew: true
    }
  } catch (err) {
    console.error('添加商户白名单失败', err)
    return {
      success: false,
      message: '添加失败: ' + err.message
    }
  }
}

async function addMerchant(openid, nickname) {
  await db.collection('merchantWhitelist').add({
    data: {
      openid: openid,
      nickname: nickname || '商户',
      status: 1,
      createTime: Date.now(),
      updateTime: Date.now()
    }
  })
}