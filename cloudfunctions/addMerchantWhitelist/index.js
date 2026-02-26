const cloud = require('wx-server-sdk')
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID
  const { nickname } = event

  try {
    const existRes = await db.collection('merchantWhitelist').where({
      openid: openid
    }).get()

    if (existRes.data.length > 0) {
      await db.collection('merchantWhitelist').where({
        openid: openid
      }).update({
        data: {
          status: 1,
          nickname: nickname || existRes.data[0].nickname,
          updateTime: new Date().getTime()
        }
      })
      return {
        success: true,
        message: '已更新商户白名单',
        openid: openid,
        isNew: false
      }
    }

    await db.collection('merchantWhitelist').add({
      data: {
        openid: openid,
        nickname: nickname || '商户',
        status: 1,
        createTime: new Date().getTime(),
        updateTime: new Date().getTime()
      }
    })

    return {
      success: true,
      message: '已添加到商户白名单',
      openid: openid,
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