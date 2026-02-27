const cloud = require('wx-server-sdk')
const fs = require('fs')
const path = require('path')
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const _ = db.command

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID
  const { tableNumber, page = 'pages/index/index' } = event

  // 验证商户权限
  const whitelistRes = await db.collection('merchantWhitelist')
    .where({ openid: openid, status: 1 })
    .get()

  if (whitelistRes.data.length === 0) {
    return {
      success: false,
      message: '无权限访问'
    }
  }

  if (!tableNumber) {
    return {
      success: false,
      message: '缺少桌号参数'
    }
  }

  try {
    const tablesRes = await db.collection('tables')
      .where({ tableNumber: tableNumber })
      .get()

    if (tablesRes.data.length === 0) {
      return {
        success: false,
        message: '桌号不存在'
      }
    }

    const table = tablesRes.data[0]

    const result = await cloud.openapi.wxacode.getUnlimited({
      scene: `table=${tableNumber}`,
      page: page,
      width: 430,
      autoColor: false,
      lineColor: { r: 0, g: 0, b: 0 },
      isHyaline: false
    })

    const buffer = result.buffer

    const uploadRes = await cloud.uploadFile({
      cloudPath: `qrcodes/table-${tableNumber}-${Date.now()}.png`,
      fileContent: buffer
    })

    const fileID = uploadRes.fileID

    await db.collection('tables').doc(table._id).update({
      data: {
        qrCode: fileID,
        updateTime: new Date().getTime()
      }
    })

    return {
      success: true,
      fileID: fileID,
      downloadURL: `https://7465-tlw-3g0c4d0c3c8c4d-1317325436.tcb.qcloud.la/qrcodes/table-${tableNumber}-${Date.now()}.png`
    }
  } catch (err) {
    console.error('生成桌号二维码失败', err)
    return {
      success: false,
      message: '生成桌号二维码失败',
      error: err.message
    }
  }
}