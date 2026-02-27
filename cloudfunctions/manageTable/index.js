const cloud = require('wx-server-sdk')
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

// 验证商户权限
async function checkMerchantPermission(openid) {
  const whitelist = await db.collection('merchantWhitelist')
    .where({ openid: openid, status: 1 })
    .get()
  return whitelist.data.length > 0
}

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID
  const { action, tableId, tableData, status } = event

  // 所有操作都需要商户权限
  const hasPermission = await checkMerchantPermission(openid)
  if (!hasPermission) {
    return { success: false, message: '无权限访问' }
  }

  switch (action) {
    case 'create':
      return await createTable(tableData)
    case 'update':
      return await updateTable(tableId, tableData)
    case 'delete':
      return await deleteTable(tableId)
    case 'toggleStatus':
      return await toggleTableStatus(tableId, status)
    case 'getList':
      return await getTableList(status)
    case 'getDetail':
      return await getTableDetail(tableId)
    default:
      return { success: false, message: '未知操作' }
  }
}

async function createTable(tableData) {
  if (!tableData || !tableData.tableNumber) {
    return { success: false, message: '缺少桌号' }
  }

  try {
    // 检查桌号是否已存在
    const existRes = await db.collection('tables')
      .where({ tableNumber: tableData.tableNumber })
      .get()

    if (existRes.data.length > 0) {
      return { success: false, message: '桌号已存在' }
    }

    const now = new Date().getTime()
    const table = {
      tableNumber: tableData.tableNumber,
      seats: tableData.seats || 4,
      status: 0, // 0: 空闲, 1: 使用中
      qrCode: '',
      createTime: now,
      updateTime: now
    }

    const res = await db.collection('tables').add({ data: table })
    return { success: true, data: { _id: res._id, ...table }, message: '创建成功' }
  } catch (err) {
    console.error('创建桌号失败', err)
    return { success: false, message: '创建桌号失败' }
  }
}

async function updateTable(tableId, tableData) {
  if (!tableId || !tableData) {
    return { success: false, message: '缺少必要参数' }
  }

  try {
    // 如果更新桌号，检查是否与其他桌号冲突
    if (tableData.tableNumber) {
      const existRes = await db.collection('tables')
        .where({ tableNumber: tableData.tableNumber })
        .get()

      if (existRes.data.length > 0 && existRes.data[0]._id !== tableId) {
        return { success: false, message: '桌号已存在' }
      }
    }

    const updateData = {
      ...tableData,
      updateTime: new Date().getTime()
    }
    // 移除不可更新的字段
    delete updateData._id
    delete updateData.createTime

    await db.collection('tables').doc(tableId).update({ data: updateData })
    return { success: true, message: '更新成功' }
  } catch (err) {
    console.error('更新桌号失败', err)
    return { success: false, message: '更新桌号失败' }
  }
}

async function deleteTable(tableId) {
  if (!tableId) {
    return { success: false, message: '缺少桌号ID' }
  }

  try {
    await db.collection('tables').doc(tableId).remove()
    return { success: true, message: '删除成功' }
  } catch (err) {
    console.error('删除桌号失败', err)
    return { success: false, message: '删除桌号失败' }
  }
}

async function toggleTableStatus(tableId, status) {
  if (!tableId || status === undefined) {
    return { success: false, message: '缺少必要参数' }
  }

  try {
    await db.collection('tables').doc(tableId).update({
      data: {
        status: status,
        updateTime: new Date().getTime()
      }
    })
    return {
      success: true,
      message: status === 1 ? '已设为使用中' : '已设为空闲',
      data: { status }
    }
  } catch (err) {
    console.error('更新桌号状态失败', err)
    return { success: false, message: '更新状态失败' }
  }
}

async function getTableList(status) {
  try {
    let query = db.collection('tables')

    if (status !== undefined && status !== 'all') {
      const statusValue = status === 'occupied' ? 1 : (status === 'idle' ? 0 : parseInt(status))
      query = query.where({ status: statusValue })
    }

    const res = await query.orderBy('tableNumber', 'asc').get()
    return {
      success: true,
      data: res.data.map(t => ({
        ...t,
        statusText: t.status === 1 ? '使用中' : '空闲'
      }))
    }
  } catch (err) {
    console.error('获取桌号列表失败', err)
    return { success: false, message: '获取桌号列表失败' }
  }
}

async function getTableDetail(tableId) {
  if (!tableId) {
    return { success: false, message: '缺少桌号ID' }
  }

  try {
    const res = await db.collection('tables').doc(tableId).get()
    return { success: true, data: res.data }
  } catch (err) {
    console.error('获取桌号详情失败', err)
    return { success: false, message: '获取桌号详情失败' }
  }
}