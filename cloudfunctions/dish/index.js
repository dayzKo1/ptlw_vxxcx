/**
 * 菜品服务云函数
 * 整合：manageDish 的所有操作
 */

const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()

exports.main = async (event, context) => {
  const { action } = event

  switch (action) {
    case 'list': return await getDishList(event, context)
    case 'detail': return await getDishDetail(event, context)
    case 'create': return await createDish(event, context)
    case 'update': return await updateDish(event, context)
    case 'delete': return await deleteDish(event, context)
    case 'toggle': return await toggleDishStatus(event, context)
    default: return { success: false, message: '未知操作' }
  }
}

// 获取菜品列表
async function getDishList(event, context) {
  const { categoryId, status } = event

  try {
    let query = db.collection('dishes')
    if (categoryId) query = query.where({ categoryId })
    if (status !== undefined) query = query.where({ status })

    const res = await query.orderBy('sort', 'asc').orderBy('createTime', 'desc').get()
    return { success: true, data: res.data }
  } catch (err) {
    return { success: false, message: '获取失败' }
  }
}

// 获取菜品详情
async function getDishDetail(event, context) {
  const { dishId } = event

  try {
    const res = await db.collection('dishes').doc(dishId).get()
    return { success: true, data: res.data }
  } catch (err) {
    return { success: false, message: '获取失败' }
  }
}

// 创建菜品
async function createDish(event, context) {
  if (!await checkMerchantPermission()) {
    return { success: false, message: '无权限' }
  }

  const { dishData } = event
  if (!dishData?.name || dishData?.price === undefined) {
    return { success: false, message: '缺少必要参数' }
  }

  try {
    const dish = {
      ...dishData,
      status: dishData.status ?? 1,
      sort: dishData.sort || 0,
      createTime: Date.now(),
      updateTime: Date.now()
    }

    const res = await db.collection('dishes').add({ data: dish })
    return { success: true, data: { _id: res._id, ...dish } }
  } catch (err) {
    return { success: false, message: '创建失败' }
  }
}

// 更新菜品
async function updateDish(event, context) {
  if (!await checkMerchantPermission()) {
    return { success: false, message: '无权限' }
  }

  const { dishId, dishData } = event

  try {
    await db.collection('dishes').doc(dishId).update({
      data: { ...dishData, updateTime: Date.now() }
    })
    return { success: true, message: '更新成功' }
  } catch (err) {
    return { success: false, message: '更新失败' }
  }
}

// 删除菜品
async function deleteDish(event, context) {
  if (!await checkMerchantPermission()) {
    return { success: false, message: '无权限' }
  }

  const { dishId } = event

  try {
    await db.collection('dishes').doc(dishId).remove()
    return { success: true, message: '删除成功' }
  } catch (err) {
    return { success: false, message: '删除失败' }
  }
}

// 切换菜品状态
async function toggleDishStatus(event, context) {
  if (!await checkMerchantPermission()) {
    return { success: false, message: '无权限' }
  }

  const { dishId, status } = event

  try {
    await db.collection('dishes').doc(dishId).update({
      data: { status, updateTime: Date.now() }
    })
    return { success: true, message: status === 1 ? '上架成功' : '下架成功' }
  } catch (err) {
    return { success: false, message: '操作失败' }
  }
}

async function checkMerchantPermission() {
  const wxContext = cloud.getWXContext()
  const res = await db.collection('merchantWhitelist').where({ openid: wxContext.OPENID, status: 1 }).get()
  return res.data.length > 0
}