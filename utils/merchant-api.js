/**
 * 商户后台 API 封装模块
 */

const mock = require('./mock.js')

// 订单状态映射
const ORDER_STATUS = {
  PENDING: 0,    // 待支付
  COOKING: 1,    // 制作中
  SERVED: 2,     // 已出餐
  COMPLETED: 3,  // 已完成
  CANCELLED: 4   // 已取消
}

const ORDER_STATUS_TEXT = {
  0: '待支付',
  1: '制作中',
  2: '已出餐',
  3: '已完成',
  4: '已取消'
}

// 辣度选项
const SPICY_OPTIONS = ['不辣', '微辣', '中辣', '特辣', '变态辣']

/**
 * 判断是否开发模式
 */
function isDevMode() {
  return mock.isDevMode()
}

/**
 * 云函数调用封装
 */
function callCloudFunction(name, data) {
  return new Promise((resolve, reject) => {
    wx.cloud.callFunction({
      name,
      data,
      success: res => resolve(res.result),
      fail: err => reject(err)
    })
  })
}

/**
 * 数据库查询封装
 */
function dbQuery(collection, condition = {}, options = {}) {
  return new Promise((resolve, reject) => {
    const db = wx.cloud.database()
    let query = db.collection(collection).where(condition)
    
    if (options.orderBy) {
      query = query.orderBy(options.orderBy.field, options.orderBy.order || 'desc')
    }
    if (options.limit) {
      query = query.limit(options.limit)
    }
    
    query.get({
      success: res => resolve(res.data),
      fail: err => reject(err)
    })
  })
}

// ==================== 统计相关 ====================

function getStats() {
  return new Promise((resolve) => {
    if (isDevMode()) {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      resolve({
        todayOrders: mock.orders.filter(o => o.createTime >= today.getTime()).length,
        todayIncome: mock.orders
          .filter(o => o.createTime >= today.getTime() && o.status >= 1)
          .reduce((sum, o) => sum + o.totalPrice, 0),
        pendingOrders: mock.orders.filter(o => o.status === 0).length,
        cookingOrders: mock.orders.filter(o => o.status === 1).length,
        dishCount: mock.dishes.length,
        onlineDishCount: mock.dishes.filter(d => d.status === 1).length,
        tableCount: mock.tables.length,
        activeTableCount: mock.tables.filter(t => t.status === 1).length
      })
      return
    }

    callCloudFunction('merchantStats', { type: 'overview' })
      .then(res => resolve(res.success ? res.data : {}))
      .catch(() => resolve({}))
  })
}

// ==================== 订单相关 ====================

function getOrders(status = -1) {
  return new Promise((resolve) => {
    if (isDevMode()) {
      let orders = [...mock.orders]
      if (status >= 0) {
        orders = orders.filter(o => o.status === status)
      }
      resolve(processOrders(orders))
      return
    }

    callCloudFunction('getMerchantOrders', { status })
      .then(res => {
        if (res.success) {
          resolve(processOrders(res.data.orders))
        } else {
          console.error('获取订单失败', res.message)
          resolve([])
        }
      })
      .catch(() => resolve([]))
  })
}

function processOrders(orders) {
  return orders.map(order => ({
    ...order,
    orderNo: order.orderNo || (order._id || '').slice(-8),
    statusText: ORDER_STATUS_TEXT[order.status] || '未知',
    timeText: formatTime(order.createTime),
    itemCount: order.items ? order.items.reduce((sum, item) => sum + item.quantity, 0) : 0
  }))
}

function updateOrderStatus(orderId, status) {
  return callCloudFunction('updateOrderStatus', { orderId, status })
}

function cancelOrder(orderId) {
  return callCloudFunction('cancelOrder', { orderId })
}

// ==================== 菜品相关 ====================

function getDishes(status = 'all') {
  return new Promise((resolve) => {
    if (isDevMode()) {
      let dishes = [...mock.dishes]
      if (status === 'online') {
        dishes = dishes.filter(d => d.status === 1)
      } else if (status === 'offline') {
        dishes = dishes.filter(d => d.status === 0)
      }
      resolve(dishes)
      return
    }

    callCloudFunction('manageDish', { action: 'getList' })
      .then(res => {
        let dishes = res.data || []
        if (status === 'online') {
          dishes = dishes.filter(d => d.status === 1)
        } else if (status === 'offline') {
          dishes = dishes.filter(d => d.status === 0)
        }
        resolve(dishes)
      })
      .catch(() => resolve([]))
  })
}

function createDish(dishData) {
  return callCloudFunction('manageDish', { action: 'create', dishData })
}

function updateDish(dishId, dishData) {
  return callCloudFunction('manageDish', { action: 'update', dishId, dishData })
}

function toggleDishStatus(dishId, status) {
  return callCloudFunction('manageDish', { action: 'toggleStatus', dishId, status })
}

function deleteDish(dishId) {
  return callCloudFunction('manageDish', { action: 'delete', dishId })
}

// ==================== 桌号相关 ====================

function getTables(status = 'all') {
  return new Promise((resolve) => {
    if (isDevMode()) {
      let tables = [...mock.tables]
      if (status === 'occupied') {
        tables = tables.filter(t => t.status === 1)
      } else if (status === 'idle') {
        tables = tables.filter(t => t.status === 0)
      }
      resolve(tables.map(t => ({
        ...t,
        statusText: t.status === 1 ? '使用中' : '空闲',
        timeText: t.orderTime ? formatTime(t.orderTime) : ''
      })))
      return
    }

    callCloudFunction('getTables', { status })
      .then(res => {
        if (res.success) {
          resolve(res.tables.map(t => ({
            ...t,
            statusText: t.status === 1 ? '使用中' : '空闲',
            timeText: t.orderTime ? formatTime(t.orderTime) : ''
          })))
        } else {
          console.error('获取桌号失败', res.message)
          resolve([])
        }
      })
      .catch(() => resolve([]))
  })
}

function createTable(tableData) {
  return callCloudFunction('manageTable', { action: 'create', tableData })
}

function updateTable(tableId, tableData) {
  return callCloudFunction('manageTable', { action: 'update', tableId, tableData })
}

function toggleTableStatus(tableId, status) {
  return callCloudFunction('manageTable', { action: 'toggleStatus', tableId, status })
}

function deleteTable(tableId) {
  return callCloudFunction('manageTable', { action: 'delete', tableId })
}

// ==================== 分类相关 ====================

function getCategories() {
  return new Promise((resolve) => {
    if (isDevMode()) {
      resolve([...mock.categories])
      return
    }

    dbQuery('categories', { status: 1 }, { orderBy: { field: 'sort', order: 'asc' } })
      .then(categories => resolve(categories))
      .catch(() => resolve([
        { _id: '1', name: '热菜' },
        { _id: '2', name: '凉菜' },
        { _id: '3', name: '主食' }
      ]))
  })
}

// ==================== 工具函数 ====================

function formatTime(timestamp) {
  if (!timestamp) return ''
  const date = new Date(timestamp)
  const month = date.getMonth() + 1
  const day = date.getDate()
  const hour = date.getHours().toString().padStart(2, '0')
  const minute = date.getMinutes().toString().padStart(2, '0')
  return `${month}月${day}日 ${hour}:${minute}`
}

function uploadImage(tempFilePath) {
  return new Promise((resolve, reject) => {
    const cloudPath = 'dishes/' + Date.now() + '-' + Math.random().toString(36).substr(2, 9)
    wx.cloud.uploadFile({
      cloudPath,
      filePath: tempFilePath,
      success: res => resolve(res.fileID),
      fail: err => reject(err)
    })
  })
}

module.exports = {
  // 常量
  ORDER_STATUS,
  ORDER_STATUS_TEXT,
  SPICY_OPTIONS,
  
  // 统计
  getStats,
  
  // 订单
  getOrders,
  updateOrderStatus,
  cancelOrder,
  
  // 菜品
  getDishes,
  createDish,
  updateDish,
  toggleDishStatus,
  deleteDish,
  
  // 桌号
  getTables,
  createTable,
  updateTable,
  toggleTableStatus,
  deleteTable,
  
  // 分类
  getCategories,
  
  // 工具
  isDevMode,
  formatTime,
  uploadImage,
  callCloudFunction
}