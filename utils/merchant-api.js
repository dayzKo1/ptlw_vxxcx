/**
 * 商户后台 API 封装模块
 * 适配新版整合云函数
 */

const mock = require('./mock.js')

// 订单状态
const ORDER_STATUS = {
  PENDING: 0, WAITING: 1, COOKING: 2, SERVED: 3, COMPLETED: 4, CANCELLED: 5, REFUNDED: 6
}

const ORDER_STATUS_TEXT = {
  0: '待支付', 1: '待接单', 2: '制作中', 3: '已出餐', 4: '已完成', 5: '已取消', 6: '已退款'
}

const SPICY_OPTIONS = ['不辣', '微辣', '中辣', '特辣', '变态辣']

function isDevMode() {
  return mock.isDevMode()
}

// 云函数调用封装
function callCloudFunction(name, action, data = {}) {
  return new Promise((resolve, reject) => {
    wx.cloud.callFunction({
      name,
      data: { action, ...data },
      success: res => resolve(res.result),
      fail: err => reject(err)
    })
  })
}

// 数据库查询封装
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
    query.get({ success: res => resolve(res.data), fail: err => reject(err) })
  })
}

// ==================== 统计 ====================
function getStats() {
  return new Promise((resolve) => {
    if (isDevMode()) {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      resolve({
        todayOrders: mock.orders.filter(o => o.createTime >= today.getTime()).length,
        todayIncome: mock.orders.filter(o => o.createTime >= today.getTime() && o.status >= 1).reduce((sum, o) => sum + o.totalPrice, 0),
        pendingOrders: mock.orders.filter(o => o.status === 0).length,
        cookingOrders: mock.orders.filter(o => o.status === 1).length,
        dishCount: mock.dishes.length,
        onlineDishCount: mock.dishes.filter(d => d.status === 1).length,
        tableCount: mock.tables.length,
        activeTableCount: mock.tables.filter(t => t.status === 1).length
      })
      return
    }
    callCloudFunction('stats', '').then(res => resolve(res.success ? res.data : {})).catch(() => resolve({}))
  })
}

// ==================== 订单 ====================
function getOrders(status = -1, startDate = '', endDate = '') {
  return new Promise((resolve) => {
    if (isDevMode()) {
      let orders = [...mock.orders]
      if (status >= 0) orders = orders.filter(o => o.status === status)
      resolve(processOrders(orders))
      return
    }
    callCloudFunction('order', 'getMerchantList', { status, startDate, endDate })
      .then(res => resolve(res.success ? processOrders(res.data.orders) : []))
      .catch(() => resolve([]))
  })
}

function processOrders(orders) {
  return orders.map(order => ({
    ...order,
    orderNo: order.orderNo || (order._id || '').slice(-8),
    orderTypeText: order.orderTypeText || (order.orderType === 'T' ? '桌号订单' : order.orderType === 'P' ? '自取订单' : '外卖订单'),
    statusText: ORDER_STATUS_TEXT[order.status] || '未知',
    timeText: formatTime(order.createTime),
    itemCount: order.items ? order.items.reduce((sum, item) => sum + item.quantity, 0) : 0
  }))
}

function updateOrderStatus(orderId, status) {
  return new Promise((resolve, reject) => {
    wx.cloud.callFunction({
      name: 'order',
      data: { action: 'updateStatus', orderId, status },
      success: res => {
        console.log('updateOrderStatus result:', res.result)
        resolve(res.result)
      },
      fail: err => {
        console.error('updateOrderStatus failed:', err)
        reject(err)
      }
    })
  })
}

function cancelOrder(orderId) {
  return callCloudFunction('order', 'cancel', { orderId })
}

function refundOrder(orderId, refundReason, refundAmount) {
  return callCloudFunction('order', 'refund', { orderId, refundReason, refundAmount })
}

// ==================== 菜品 ====================
function getDishes(status = 'all') {
  return new Promise((resolve) => {
    if (isDevMode()) {
      let dishes = [...mock.dishes]
      if (status === 'online') dishes = dishes.filter(d => d.status === 1)
      else if (status === 'offline') dishes = dishes.filter(d => d.status === 0)
      resolve(dishes)
      return
    }
    callCloudFunction('dish', 'list', {})
      .then(res => {
        let dishes = res.data || []
        if (status === 'online') dishes = dishes.filter(d => d.status === 1)
        else if (status === 'offline') dishes = dishes.filter(d => d.status === 0)
        resolve(dishes)
      })
      .catch(() => resolve([]))
  })
}

function createDish(dishData) {
  return callCloudFunction('dish', 'create', { dishData })
}

function updateDish(dishId, dishData) {
  return callCloudFunction('dish', 'update', { dishId, dishData })
}

function toggleDishStatus(dishId, status) {
  return callCloudFunction('dish', 'toggle', { dishId, status })
}

function deleteDish(dishId) {
  return callCloudFunction('dish', 'delete', { dishId })
}

// ==================== 桌号 ====================
function getTables(status = 'all') {
  return new Promise((resolve) => {
    if (isDevMode()) {
      let tables = [...mock.tables]
      if (status === 'occupied') tables = tables.filter(t => t.status === 1)
      else if (status === 'idle') tables = tables.filter(t => t.status === 0)
      resolve(tables.map(t => ({
        ...t,
        statusText: t.status === 1 ? '使用中' : '空闲',
        timeText: t.orderTime ? formatTime(t.orderTime) : ''
      })))
      return
    }

    const db = wx.cloud.database()
    let query = db.collection('tables')
    if (status === 'occupied') query = query.where({ status: 1 })
    else if (status === 'idle') query = query.where({ status: 0 })

    query.orderBy('tableNumber', 'asc').get({
      success: res => {
        resolve(res.data.map(t => ({
          ...t,
          statusText: t.status === 1 ? '使用中' : '空闲',
          timeText: t.orderTime ? formatTime(t.orderTime) : ''
        })))
      },
      fail: () => resolve([])
    })
  })
}

function createTable(tableData) {
  return callCloudFunction('table', 'create', { tableData })
}

function updateTable(tableId, tableData) {
  return callCloudFunction('table', 'update', { tableId, tableData })
}

function toggleTableStatus(tableId, status) {
  return callCloudFunction('table', 'toggle', { tableId, status })
}

function deleteTable(tableId) {
  return callCloudFunction('table', 'delete', { tableId })
}

// ==================== 分类 ====================
function getCategories() {
  return new Promise((resolve) => {
    if (isDevMode()) {
      resolve([...mock.categories])
      return
    }
    callCloudFunction('dish', 'categoryList', {})
      .then(res => resolve(res.data || []))
      .catch(() => resolve([
        { _id: '1', name: '热菜', status: 1 },
        { _id: '2', name: '凉菜', status: 1 },
        { _id: '3', name: '主食', status: 1 }
      ]))
  })
}

function createCategory(categoryData) {
  return callCloudFunction('dish', 'categoryCreate', { categoryData })
}

function updateCategory(categoryId, categoryData) {
  return callCloudFunction('dish', 'categoryUpdate', { categoryId, categoryData })
}

function deleteCategory(categoryId) {
  return callCloudFunction('dish', 'categoryDelete', { categoryId })
}

// ==================== 店铺设置 ====================
function getShopInfo() {
  return callCloudFunction('shop', 'get')
}

function updateShopInfo(shopData) {
  return callCloudFunction('shop', 'update', { shopData })
}

function toggleAutoAccept() {
  return callCloudFunction('shop', 'toggleAutoAccept')
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
  ORDER_STATUS,
  ORDER_STATUS_TEXT,
  SPICY_OPTIONS,

  getStats,

  getOrders,
  updateOrderStatus,
  cancelOrder,
  refundOrder,

  getDishes,
  createDish,
  updateDish,
  toggleDishStatus,
  deleteDish,

  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,

  getTables,
  createTable,
  updateTable,
  toggleTableStatus,
  deleteTable,

  getShopInfo,
  updateShopInfo,
  toggleAutoAccept,

  isDevMode,
  formatTime,
  uploadImage,
  callCloudFunction
}