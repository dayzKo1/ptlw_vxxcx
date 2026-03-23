/**
 * 桌号服务云函数
 * 整合：getTables, manageTable, generateTableQRCode, batchGenerateTableQRCode
 */

const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()

exports.main = async (event, context) => {
  const { action } = event

  switch (action) {
    case 'list': return await getTableList(event, context)
    case 'create': return await createTable(event, context)
    case 'update': return await updateTable(event, context)
    case 'delete': return await deleteTable(event, context)
    case 'toggle': return await toggleTableStatus(event, context)
    case 'generateQR': return await generateQRCode(event, context)
    case 'batchGenerateQR': return await batchGenerateQRCode(event, context)
    default: return { success: false, message: '未知操作' }
  }
}

// 获取桌号列表
async function getTableList(event, context) {
  const { status } = event

  try {
    let query = db.collection('tables')
    if (status === 'occupied') query = query.where({ status: 1 })
    else if (status === 'idle') query = query.where({ status: 0 })

    const res = await query.orderBy('tableNumber', 'asc').get()
    return {
      success: true,
      data: res.data.map(t => ({
        ...t,
        statusText: t.status === 1 ? '使用中' : '空闲'
      }))
    }
  } catch (err) {
    return { success: false, message: '获取失败' }
  }
}

// 创建桌号
async function createTable(event, context) {
  if (!await checkMerchantPermission()) return { success: false, message: '无权限' }

  const { tableData } = event

  try {
    const res = await db.collection('tables').add({
      data: {
        ...tableData,
        status: 0,
        createTime: Date.now()
      }
    })
    return { success: true, data: { _id: res._id } }
  } catch (err) {
    return { success: false, message: '创建失败' }
  }
}

// 更新桌号
async function updateTable(event, context) {
  if (!await checkMerchantPermission()) return { success: false, message: '无权限' }

  const { tableId, tableData } = event

  try {
    await db.collection('tables').doc(tableId).update({ data: tableData })
    return { success: true }
  } catch (err) {
    return { success: false, message: '更新失败' }
  }
}

// 删除桌号
async function deleteTable(event, context) {
  if (!await checkMerchantPermission()) return { success: false, message: '无权限' }

  const { tableId } = event

  try {
    await db.collection('tables').doc(tableId).remove()
    return { success: true }
  } catch (err) {
    return { success: false, message: '删除失败' }
  }
}

// 切换桌号状态
async function toggleTableStatus(event, context) {
  if (!await checkMerchantPermission()) return { success: false, message: '无权限' }

  const { tableId, status } = event

  try {
    await db.collection('tables').doc(tableId).update({ data: { status } })
    return { success: true }
  } catch (err) {
    return { success: false, message: '操作失败' }
  }
}

// 生成二维码
async function generateQRCode(event, context) {
  if (!await checkMerchantPermission()) return { success: false, message: '无权限' }

  const { tableNumber } = event

  try {
    const res = await cloud.openapi.wxacode.getUnlimited({
      scene: `table=${tableNumber}`,
      page: 'pages/login/login',
      width: 280
    })

    const uploadRes = await cloud.uploadFile({
      cloudPath: `tables/${tableNumber}_${Date.now()}.png`,
      fileContent: res.buffer
    })

    await db.collection('tables').where({ tableNumber }).update({
      data: { qrCode: uploadRes.fileID }
    })

    return { success: true, fileID: uploadRes.fileID }
  } catch (err) {
    console.error('生成二维码失败', err)
    return { success: false, message: '生成失败' }
  }
}

// 批量生成二维码
async function batchGenerateQRCode(event, context) {
  if (!await checkMerchantPermission()) return { success: false, message: '无权限' }

  try {
    const res = await db.collection('tables').get()
    let successCount = 0

    for (const table of res.data) {
      const result = await cloud.openapi.wxacode.getUnlimited({
        scene: `table=${table.tableNumber}`,
        page: 'pages/login/login',
        width: 280
      })

      const uploadRes = await cloud.uploadFile({
        cloudPath: `tables/${table.tableNumber}_${Date.now()}.png`,
        fileContent: result.buffer
      })

      await db.collection('tables').doc(table._id).update({
        data: { qrCode: uploadRes.fileID }
      })

      successCount++
    }

    return { success: true, total: res.data.length, successCount }
  } catch (err) {
    return { success: false, message: '批量生成失败' }
  }
}

async function checkMerchantPermission() {
  const wxContext = cloud.getWXContext()
  const res = await db.collection('merchantWhitelist').where({ openid: wxContext.OPENID, status: 1 }).get()
  return res.data.length > 0
}