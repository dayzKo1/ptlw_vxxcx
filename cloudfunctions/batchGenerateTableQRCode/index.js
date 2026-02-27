const cloud = require('wx-server-sdk')
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID

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

  try {
    const tablesRes = await db.collection('tables')
      .where({ status: 1 })
      .orderBy('tableNumber', 'asc')
      .get()

    const tables = tablesRes.data
    const results = []

    for (const table of tables) {
      try {
        const result = await cloud.openapi.wxacode.getUnlimited({
          scene: `table=${table.tableNumber}`,
          page: 'pages/index/index',
          width: 430,
          autoColor: false,
          lineColor: { r: 0, g: 0, b: 0 },
          isHyaline: false
        })

        const buffer = result.buffer

        const uploadRes = await cloud.uploadFile({
          cloudPath: `qrcodes/table-${table.tableNumber}-${Date.now()}.png`,
          fileContent: buffer
        })

        const fileID = uploadRes.fileID

        await db.collection('tables').doc(table._id).update({
          data: {
            qrCode: fileID,
            updateTime: new Date().getTime()
          }
        })

        results.push({
          tableNumber: table.tableNumber,
          success: true,
          fileID: fileID
        })
      } catch (err) {
        console.error(`生成${table.tableNumber}二维码失败`, err)
        results.push({
          tableNumber: table.tableNumber,
          success: false,
          error: err.message
        })
      }
    }

    return {
      success: true,
      results: results,
      total: tables.length,
      successCount: results.filter(r => r.success).length
    }
  } catch (err) {
    console.error('批量生成二维码失败', err)
    return {
      success: false,
      message: '批量生成二维码失败'
    }
  }
}