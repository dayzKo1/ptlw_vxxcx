/**
 * 订单服务云函数
 * 整合：createOrder, createPayment, paymentCallback, cancelOrder, cancelTimeoutOrders,
 *       getUserOrders, getMerchantOrders, getOrderDetail, updateOrderStatus, refundOrder, deleteOrder
 */

const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()
const _ = db.command

const ORDER_STATUS = {
  PENDING: 0, WAITING: 1, COOKING: 2, SERVED: 3, COMPLETED: 4, CANCELLED: 5, REFUNDED: 6
}

const ORDER_STATUS_TEXT = {
  0: '待支付', 1: '待接单', 2: '制作中', 3: '已出餐', 4: '已完成', 5: '已取消', 6: '已退款'
}

const ORDER_TIMEOUT = 15 * 60 * 1000

exports.main = async (event, context) => {
  const { action } = event

  switch (action) {
    case 'create': return await createOrder(event, context)
    case 'pay': return await createPayment(event, context)
    case 'payCallback': return await paymentCallback(event, context)
    case 'cancel': return await cancelOrder(event, context)
    case 'cancelTimeout': return await cancelTimeoutOrders(event, context)
    case 'getUserList': return await getUserOrders(event, context)
    case 'getMerchantList': return await getMerchantOrders(event, context)
    case 'getDetail': return await getOrderDetail(event, context)
    case 'updateStatus': return await updateOrderStatus(event, context)
    case 'refund': return await refundOrder(event, context)
    case 'delete': return await deleteOrder(event, context)
    default: return { success: false, message: '未知操作' }
  }
}

// ==================== 创建订单 ====================
async function createOrder(event, context) {
  const wxContext = cloud.getWXContext()
  const { tableNumber, items, totalPrice, remark, deliveryMode, addressId, userInfo } = event

  if (!items?.length) return { success: false, message: '购物车为空' }
  if (!totalPrice || totalPrice <= 0) return { success: false, message: '订单金额异常' }

  try {
    const { orderNo, orderType, sequence } = await generateOrderNo(tableNumber, deliveryMode)
    
    let orderTypeText = '自取订单'
    let tableId = ''
    
    if (tableNumber && tableNumber !== '0' && tableNumber !== '未选择') {
      orderTypeText = '桌号订单'
      const tableRes = await db.collection('tables').where({ tableNumber }).limit(1).get()
      if (tableRes.data.length > 0) {
        tableId = tableRes.data[0]._id
      }
    } else if (deliveryMode === 'delivery') {
      orderTypeText = '外卖订单'
    }

    const orderData = {
      _openid: wxContext.OPENID,
      orderNo, orderType, orderTypeText, sequence,
      tableNumber: tableNumber || '',
      tableId,
      items, totalPrice, remark,
      deliveryMode: deliveryMode || 'pickup',
      addressId: addressId || '',
      status: 0,
      createTime: Date.now(),
      updateTime: Date.now(),
      timeoutAt: Date.now() + ORDER_TIMEOUT,
      // 用户信息冗余（方便商户查看）
      userNickName: userInfo?.nickName || '微信用户',
      userAvatarUrl: userInfo?.avatarUrl || ''
    }

    const res = await db.collection('orders').add({ data: orderData })

    // 如果是桌号订单，锁定桌号
    if (tableId) {
      await db.collection('tables').doc(tableId).update({
        data: { 
          status: 1, 
          currentOrderId: res._id, 
          orderTime: Date.now() 
        }
      })
    }

    return { success: true, orderId: res._id, orderNo, orderType, sequence }
  } catch (err) {
    console.error('创建订单失败', err)
    return { success: false, message: '创建订单失败' }
  }
}

// ==================== 创建支付 ====================
async function createPayment(event, context) {
  const { orderId } = event
  
  try {
    const orderRes = await db.collection('orders').doc(orderId).get()
    if (!orderRes.data) return { success: false, message: '订单不存在' }
    
    const order = orderRes.data
    if (order.status !== 0) return { success: false, message: '订单状态不允许支付' }

    // 模拟支付（实际需配置微信支付）
    const payment = {
      timeStamp: String(Math.floor(Date.now() / 1000)),
      nonceStr: Math.random().toString(36).substr(2, 32),
      package: `prepay_id=mock_${order.orderNo}`,
      signType: 'MD5',
      paySign: 'mock_sign'
    }

    return { success: true, payment }
  } catch (err) {
    return { success: false, message: '创建支付失败' }
  }
}

// ==================== 支付回调 ====================
async function paymentCallback(event, context) {
  const { returnCode, returnMsg, transactionId, outTradeNo } = event

  if (returnCode !== 'SUCCESS' || returnMsg !== 'OK') {
    return { errcode: -1, errmsg: '支付失败' }
  }

  try {
    const orderRes = await db.collection('orders').where({ orderNo: outTradeNo }).get()
    if (!orderRes.data.length) return { errcode: -1, errmsg: '订单不存在' }

    const order = orderRes.data[0]

    // 检查自动接单
    const shopRes = await db.collection('shopInfo').limit(1).get()
    const autoAccept = shopRes.data[0]?.autoAcceptOrder === true
    const newStatus = autoAccept ? 2 : 1

    await db.collection('orders').doc(order._id).update({
      data: {
        status: newStatus,
        transactionId,
        payTime: Date.now(),
        updateTime: Date.now(),
        autoAccepted: autoAccept
      }
    })

    // 确保桌号状态
    if (order.orderType === 'T' && order.tableId) {
      await db.collection('tables').doc(order.tableId).update({
        data: { status: 1, currentOrderId: order._id }
      })
    }

    return { errcode: 0, errmsg: 'SUCCESS' }
  } catch (err) {
    return { errcode: -1, errmsg: '处理失败' }
  }
}

// ==================== 取消订单 ====================
async function cancelOrder(event, context) {
  const wxContext = cloud.getWXContext()
  const { orderId, cancelReason } = event

  try {
    const orderRes = await db.collection('orders').doc(orderId).get()
    if (!orderRes.data) return { success: false, message: '订单不存在' }

    const order = orderRes.data
    const isMerchant = await checkMerchantPermission(wxContext.OPENID)

    if (order._openid !== wxContext.OPENID && !isMerchant) {
      return { success: false, message: '无权限' }
    }

    // 检查订单状态是否可取消
    const cancellableStatus = isMerchant ? [0, 1, 2, 3] : [0, 1]
    if (!cancellableStatus.includes(order.status)) {
      return { success: false, message: '当前订单状态不可取消' }
    }

    // 已支付订单需要退款
    if (order.transactionId && order.status >= 1) {
      const refundResult = await processRefund(order, cancelReason || '订单取消')
      if (!refundResult.success) return refundResult
      return { success: true, message: '订单已取消并退款', refunded: true }
    }

    // 未支付直接取消
    await db.collection('orders').doc(orderId).update({
      data: { 
        status: 5, 
        cancelReason: cancelReason || (isMerchant ? '商户取消' : '用户取消'), 
        cancelTime: Date.now(),
        updateTime: Date.now()
      }
    })

    await releaseTable(order)
    return { success: true, message: '订单已取消' }
  } catch (err) {
    console.error('取消订单失败', err)
    return { success: false, message: '取消失败' }
  }
}

// ==================== 取消超时订单 ====================
async function cancelTimeoutOrders(event, context) {
  const timeoutThreshold = Date.now() - ORDER_TIMEOUT

  try {
    const result = await db.collection('orders')
      .where({ status: 0, createTime: _.lt(timeoutThreshold) })
      .get()

    for (const order of result.data) {
      await db.collection('orders').doc(order._id).update({
        data: { status: 5, cancelReason: '超时未支付', cancelTime: Date.now() }
      })
      await releaseTable(order)
    }

    return { success: true, cancelledCount: result.data.length }
  } catch (err) {
    return { success: false, message: err.message }
  }
}

// ==================== 获取用户订单列表 ====================
async function getUserOrders(event, context) {
  const wxContext = cloud.getWXContext()
  const { status, page = 1, pageSize = 20 } = event

  try {
    let query = db.collection('orders').where({ _openid: wxContext.OPENID })
    if (status !== undefined && status !== -1) {
      if (Array.isArray(status)) {
        query = query.where({ status: _.in(status) })
      } else {
        query = query.where({ status })
      }
    }

    const countRes = await query.count()
    const res = await query
      .orderBy('createTime', 'desc')
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .get()

    return {
      success: true,
      data: {
        orders: res.data.map(formatOrder),
        total: countRes.total,
        page, pageSize,
        hasMore: res.data.length === pageSize
      }
    }
  } catch (err) {
    console.error('获取订单失败', err)
    return { success: false, message: '获取订单失败' }
  }
}

// ==================== 获取商家订单列表 ====================
async function getMerchantOrders(event, context) {
  const wxContext = cloud.getWXContext()
  const { status, startDate, endDate, page = 1, pageSize = 50 } = event

  if (!await checkMerchantPermission(wxContext.OPENID)) {
    return { success: false, message: '无权限' }
  }

  try {
    let query = db.collection('orders')
    
    // 状态筛选
    if (status !== undefined && status !== -1) {
      if (Array.isArray(status)) {
        query = query.where({ status: _.in(status) })
      } else {
        query = query.where({ status })
      }
    }
    
    // 日期筛选
    if (startDate) {
      const startTimestamp = new Date(startDate + 'T00:00:00').getTime()
      query = query.where({ createTime: _.gte(startTimestamp) })
    }
    if (endDate) {
      const endTimestamp = new Date(endDate + 'T23:59:59').getTime()
      query = query.where({ createTime: _.lte(endTimestamp) })
    }

    const countRes = await query.count()
    const res = await query
      .orderBy('createTime', 'desc')
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .get()

    return {
      success: true,
      data: {
        orders: res.data.map(formatOrder),
        total: countRes.total,
        page, pageSize,
        hasMore: res.data.length === pageSize
      }
    }
  } catch (err) {
    console.error('获取订单失败', err)
    return { success: false, message: '获取订单失败' }
  }
}

// ==================== 获取订单详情 ====================
async function getOrderDetail(event, context) {
  const wxContext = cloud.getWXContext()
  const { orderId } = event

  try {
    const orderRes = await db.collection('orders').doc(orderId).get()
    if (!orderRes.data) return { success: false, message: '订单不存在' }

    const order = orderRes.data
    const isMerchant = await checkMerchantPermission(wxContext.OPENID)

    if (order._openid !== wxContext.OPENID && !isMerchant) {
      return { success: false, message: '无权限' }
    }

    return { success: true, data: formatOrder(order) }
  } catch (err) {
    return { success: false, message: '获取订单详情失败' }
  }
}

// ==================== 更新订单状态 ====================
async function updateOrderStatus(event, context) {
  const wxContext = cloud.getWXContext()
  const { orderId, status } = event

  if (!await checkMerchantPermission(wxContext.OPENID)) {
    return { success: false, message: '无权限' }
  }

  try {
    const orderRes = await db.collection('orders').doc(orderId).get()
    if (!orderRes.data) return { success: false, message: '订单不存在' }

    const order = orderRes.data
    const currentStatus = order.status

    // 验证状态转换是否合法
    const validTransitions = {
      0: [1, 5],       // 待支付 -> 待接单/已取消
      1: [2, 5, 6],    // 待接单 -> 制作中/已取消/已退款
      2: [3, 5, 6],    // 制作中 -> 已出餐/已取消/已退款
      3: [4, 6],       // 已出餐 -> 已完成/已退款
      4: [],           // 已完成 -> 不可变更
      5: [],           // 已取消 -> 不可变更
      6: []            // 已退款 -> 不可变更
    }

    if (!validTransitions[currentStatus]?.includes(status)) {
      return { 
        success: false, 
        message: `订单状态不允许从"${ORDER_STATUS_TEXT[currentStatus]}"变为"${ORDER_STATUS_TEXT[status]}"` 
      }
    }

    const updateData = { status, updateTime: Date.now() }
    if (status === 2) updateData.acceptTime = Date.now()
    if (status === 3) updateData.serveTime = Date.now()
    if (status === 4) updateData.completeTime = Date.now()

    await db.collection('orders').doc(orderId).update({ data: updateData })

    // 完成或取消时释放桌号
    if (status === 4 || status === 5 || status === 6) {
      await releaseTable(orderRes.data)
    }

    return { success: true, message: '状态更新成功', data: { status, statusText: ORDER_STATUS_TEXT[status] } }
  } catch (err) {
    console.error('更新订单状态失败', err)
    return { success: false, message: '更新失败' }
  }
}

// ==================== 退款 ====================
async function refundOrder(event, context) {
  const wxContext = cloud.getWXContext()
  const { orderId, refundReason, refundAmount } = event

  if (!await checkMerchantPermission(wxContext.OPENID)) {
    return { success: false, message: '无权限' }
  }

  try {
    const orderRes = await db.collection('orders').doc(orderId).get()
    if (!orderRes.data) return { success: false, message: '订单不存在' }

    const order = orderRes.data
    if (![1, 2, 3].includes(order.status)) {
      return { success: false, message: '订单状态不可退款' }
    }

    const result = await processRefund(order, refundReason || '商家退款', refundAmount)
    
    if (result.success) {
      await releaseTable(order)
    }

    return result
  } catch (err) {
    return { success: false, message: '退款失败' }
  }
}

// ==================== 删除订单 ====================
async function deleteOrder(event, context) {
  const wxContext = cloud.getWXContext()
  const { orderId } = event

  if (!await checkMerchantPermission(wxContext.OPENID)) {
    return { success: false, message: '无权限' }
  }

  try {
    const orderRes = await db.collection('orders').doc(orderId).get()
    if (!orderRes.data) return { success: false, message: '订单不存在' }

    const order = orderRes.data
    if (![0, 4, 5, 6].includes(order.status)) {
      return { success: false, message: '该订单状态不允许删除' }
    }

    await db.collection('orders').doc(orderId).remove()
    return { success: true, message: '删除成功' }
  } catch (err) {
    return { success: false, message: '删除失败' }
  }
}

// ==================== 辅助函数 ====================

async function checkMerchantPermission(openid) {
  const res = await db.collection('merchantWhitelist').where({ openid, status: 1 }).get()
  return res.data.length > 0
}

async function generateOrderNo(tableNumber, deliveryMode) {
  const today = getTodayDateString()
  let orderType, sequenceKey

  if (tableNumber && tableNumber !== '0') {
    orderType = 'T'
    sequenceKey = `table_${today}_${tableNumber}`
  } else if (deliveryMode === 'delivery') {
    orderType = 'D'
    sequenceKey = `delivery_${today}`
  } else {
    orderType = 'P'
    sequenceKey = `pickup_${today}`
  }

  const sequence = await getNextSequence(sequenceKey)
  const sequenceStr = String(sequence).padStart(3, '0')

  let orderNo
  if (orderType === 'T') {
    orderNo = `${orderType}${String(tableNumber).padStart(2, '0')}-${sequenceStr}`
  } else {
    orderNo = `${orderType}${sequenceStr}`
  }

  return { orderNo, orderType, sequence }
}

async function getNextSequence(key) {
  try {
    const counterRes = await db.collection('orderCounters').where({ _id: key }).get()
    if (counterRes.data.length > 0) {
      await db.collection('orderCounters').doc(counterRes.data[0]._id).update({
        data: { value: _.inc(1), updateTime: Date.now() }
      })
      const newRes = await db.collection('orderCounters').doc(counterRes.data[0]._id).get()
      return newRes.data.value
    } else {
      await db.collection('orderCounters').add({
        data: { _id: key, value: 1, date: getTodayDateString(), createTime: Date.now() }
      })
      return 1
    }
  } catch {
    return Math.floor(Date.now() / 1000) % 10000
  }
}

function getTodayDateString() {
  const now = new Date()
  return `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`
}

async function releaseTable(order) {
  if (order.orderType !== 'T' || !order.tableId) return

  const otherOrders = await db.collection('orders')
    .where({
      tableId: order.tableId,
      status: _.in([0, 1, 2, 3]),
      _id: _.neq(order._id)
    })
    .count()

  if (otherOrders.total === 0) {
    await db.collection('tables').doc(order.tableId).update({
      data: { status: 0, currentOrderId: _.remove() }
    }).catch(() => {})
  }
}

async function processRefund(order, refundReason, refundAmount) {
  const wxContext = cloud.getWXContext()
  const totalFee = Math.round(order.totalPrice * 100)
  const refundFee = refundAmount ? Math.round(refundAmount * 100) : totalFee
  const outRefundNo = `RF${Date.now()}${Math.random().toString(36).substr(2, 4).toUpperCase()}`

  try {
    // 模拟退款（实际需调用微信支付）
    await db.collection('orders').doc(order._id).update({
      data: {
        status: 6,
        refundTime: Date.now(),
        refundReason,
        refundAmount: refundFee / 100,
        outRefundNo,
        updateTime: Date.now()
      }
    })

    // 记录退款日志
    await db.collection('refundLogs').add({
      data: {
        orderId: order._id,
        orderNo: order.orderNo,
        outRefundNo,
        transactionId: order.transactionId || '',
        totalFee, 
        refundFee,
        refundReason,
        status: 'mock',
        operator: wxContext.OPENID,
        createTime: Date.now()
      }
    })

    return { success: true, data: { refundAmount: refundFee / 100, outRefundNo } }
  } catch (err) {
    console.error('退款失败', err)
    return { success: false, message: '退款失败' }
  }
}

function formatOrder(order) {
  return {
    ...order,
    statusText: ORDER_STATUS_TEXT[order.status] || '未知',
    timeText: formatTime(order.createTime),
    itemCount: order.items?.reduce((sum, item) => sum + item.quantity, 0) || 0
  }
}

function formatTime(timestamp) {
  if (!timestamp) return ''
  const date = new Date(timestamp)
  return `${date.getMonth() + 1}月${date.getDate()}日 ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}