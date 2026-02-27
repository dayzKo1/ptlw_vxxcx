const cloud = require('wx-server-sdk')
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const _ = db.command

// 验证商户权限
async function checkMerchantPermission(wxContext) {
  const whitelist = await db.collection('merchantWhitelist')
    .where({ openid: wxContext.OPENID, status: 1 })
    .get()
  return whitelist.data.length > 0
}

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const { action, dishId, dishData, categoryId, status } = event

  // 写操作需要商户权限
  if (['create', 'update', 'delete', 'toggleStatus'].includes(action)) {
    const hasPermission = await checkMerchantPermission(wxContext)
    if (!hasPermission) {
      return { success: false, message: '无权限访问' }
    }
  }

  switch (action) {
    case 'create':
      return await createDish(dishData, wxContext)
    case 'update':
      return await updateDish(dishId, dishData, wxContext)
    case 'delete':
      return await deleteDish(dishId, wxContext)
    case 'toggleStatus':
      return await toggleDishStatus(dishId, status, wxContext)
    case 'getList':
      return await getDishList(categoryId, wxContext)
    case 'getDetail':
      return await getDishDetail(dishId, wxContext)
    default:
      return { success: false, message: '未知操作' }
  }
}

async function createDish(dishData, wxContext) {
  if (!dishData || !dishData.name || dishData.price === undefined) {
    return { success: false, message: '缺少必要参数' }
  }

  try {
    const now = new Date().getTime()
    const dish = {
      ...dishData,
      status: dishData.status !== undefined ? dishData.status : 1,
      sort: dishData.sort || 0,
      createTime: now,
      updateTime: now
    }

    const res = await db.collection('dishes').add({ data: dish })
    return { success: true, data: { _id: res._id, ...dish }, message: '创建成功' }
  } catch (err) {
    console.error('创建菜品失败', err)
    return { success: false, message: '创建菜品失败' }
  }
}

async function updateDish(dishId, dishData, wxContext) {
  if (!dishId || !dishData) {
    return { success: false, message: '缺少必要参数' }
  }

  try {
    const updateData = {
      ...dishData,
      updateTime: new Date().getTime()
    }

    await db.collection('dishes').doc(dishId).update({ data: updateData })
    return { success: true, message: '更新成功' }
  } catch (err) {
    console.error('更新菜品失败', err)
    return { success: false, message: '更新菜品失败' }
  }
}

async function deleteDish(dishId, wxContext) {
  if (!dishId) {
    return { success: false, message: '缺少菜品ID' }
  }

  try {
    await db.collection('dishes').doc(dishId).remove()
    return { success: true, message: '删除成功' }
  } catch (err) {
    console.error('删除菜品失败', err)
    return { success: false, message: '删除菜品失败' }
  }
}

async function toggleDishStatus(dishId, status, wxContext) {
  if (!dishId || status === undefined) {
    return { success: false, message: '缺少必要参数' }
  }

  try {
    await db.collection('dishes').doc(dishId).update({
      data: {
        status: status,
        updateTime: new Date().getTime()
      }
    })
    return { 
      success: true, 
      message: status === 1 ? '上架成功' : '下架成功',
      data: { status }
    }
  } catch (err) {
    console.error('更新菜品状态失败', err)
    return { success: false, message: '更新状态失败' }
  }
}

async function getDishList(categoryId, wxContext) {
  try {
    let query = db.collection('dishes')
    
    if (categoryId) {
      query = query.where({ categoryId: categoryId })
    }

    const res = await query.orderBy('sort', 'asc').orderBy('createTime', 'desc').get()
    return { success: true, data: res.data }
  } catch (err) {
    console.error('获取菜品列表失败', err)
    return { success: false, message: '获取菜品列表失败' }
  }
}

async function getDishDetail(dishId, wxContext) {
  if (!dishId) {
    return { success: false, message: '缺少菜品ID' }
  }

  try {
    const res = await db.collection('dishes').doc(dishId).get()
    return { success: true, data: res.data }
  } catch (err) {
    console.error('获取菜品详情失败', err)
    return { success: false, message: '获取菜品详情失败' }
  }
}