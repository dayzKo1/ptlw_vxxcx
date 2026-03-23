/**
 * 菜品服务云函数
 * 整合：manageDish 的所有操作 + 分类管理
 */

const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()

exports.main = async (event, context) => {
  const { action } = event

  // 分类管理
  if (action.startsWith('category')) {
    return await handleCategory(event, context)
  }

  // 菜品管理
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

// ==================== 分类管理 ====================
async function handleCategory(event, context) {
  const { action } = event

  switch (action) {
    case 'categoryList': return await getCategoryList(event, context)
    case 'categoryCreate': return await createCategory(event, context)
    case 'categoryUpdate': return await updateCategory(event, context)
    case 'categoryDelete': return await deleteCategory(event, context)
    default: return { success: false, message: '未知分类操作' }
  }
}

async function getCategoryList(event, context) {
  const { status } = event

  try {
    let query = db.collection('categories')
    if (status !== undefined) {
      query = query.where({ status })
    }

    const res = await query.orderBy('sort', 'asc').get()
    return { success: true, data: res.data }
  } catch (err) {
    return { success: false, message: '获取分类失败' }
  }
}

async function createCategory(event, context) {
  if (!await checkMerchantPermission()) {
    return { success: false, message: '无权限' }
  }

  const { categoryData } = event
  if (!categoryData?.name) {
    return { success: false, message: '分类名称不能为空' }
  }

  try {
    const category = {
      name: categoryData.name,
      description: categoryData.description || '',
      emoji: categoryData.emoji || '🍽️',
      image: categoryData.image || '',
      sort: categoryData.sort || 0,
      status: categoryData.status ?? 1,
      createTime: Date.now(),
      updateTime: Date.now()
    }

    const res = await db.collection('categories').add({ data: category })
    return { success: true, data: { _id: res._id, ...category } }
  } catch (err) {
    return { success: false, message: '创建分类失败' }
  }
}

async function updateCategory(event, context) {
  if (!await checkMerchantPermission()) {
    return { success: false, message: '无权限' }
  }

  const { categoryId, categoryData } = event

  try {
    await db.collection('categories').doc(categoryId).update({
      data: { ...categoryData, updateTime: Date.now() }
    })
    return { success: true, message: '更新成功' }
  } catch (err) {
    return { success: false, message: '更新分类失败' }
  }
}

async function deleteCategory(event, context) {
  if (!await checkMerchantPermission()) {
    return { success: false, message: '无权限' }
  }

  const { categoryId } = event

  try {
    // 检查分类下是否有菜品
    const dishesRes = await db.collection('dishes')
      .where({ categoryId })
      .count()

    if (dishesRes.total > 0) {
      return { 
        success: false, 
        message: `该分类下有 ${dishesRes.total} 道菜品，请先移动或删除菜品` 
      }
    }

    await db.collection('categories').doc(categoryId).remove()
    return { success: true, message: '删除成功' }
  } catch (err) {
    return { success: false, message: '删除分类失败' }
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