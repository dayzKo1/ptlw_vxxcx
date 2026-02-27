const cloud = require('wx-server-sdk')
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const _ = db.command

// 订单超时时间（15 分钟）
const ORDER_TIMEOUT = 15 * 60 * 1000

// 订单类型
const ORDER_TYPE = {
  TABLE: 'T',      // 桌号订单
  PICKUP: 'P',     // 自取订单
  DELIVERY: 'D'    // 外卖订单
}

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const { tableNumber, items, totalPrice, remark, deliveryMode, addressId } = event

  // 参数验证
  if (!items || !Array.isArray(items) || items.length === 0) {
    return { success: false, message: '购物车为空' }
  }

  if (!totalPrice || totalPrice <= 0) {
    return { success: false, message: '订单金额异常' }
  }

  // 检查营业时间
  const shopInfoRes = await db.collection('shopInfo').limit(1).get()
  if (shopInfoRes.data.length > 0) {
    const shopInfo = shopInfoRes.data[0]
    if (shopInfo.businessHours) {
      const now = new Date()
      const currentMinutes = now.getHours() * 60 + now.getMinutes()
      const [openTime, closeTime] = shopInfo.businessHours.split('-')
      if (openTime && closeTime) {
        const [openHour, openMin] = openTime.split(':').map(Number)
        const [closeHour, closeMin] = closeTime.split(':').map(Number)
        const openMinutes = openHour * 60 + openMin
        const closeMinutes = closeHour * 60 + closeMin

        if (currentMinutes < openMinutes || currentMinutes > closeMinutes) {
          return {
            success: false,
            message: `当前不在营业时间内，营业时间为 ${shopInfo.businessHours}`
          }
        }
      }
    }
  }

  try {
    // 生成有序订单号
    const { orderNo, orderType, sequence } = await generateOrderNo(tableNumber, deliveryMode)

    // 确定订单类型
    let finalDeliveryMode = deliveryMode || 'pickup'
    let orderTypeText = ''
    if (tableNumber && tableNumber !== '0' && tableNumber !== '未选择') {
      orderTypeText = '桌号订单'
    } else if (finalDeliveryMode === 'delivery') {
      orderTypeText = '外卖订单'
    } else {
      orderTypeText = '自取订单'
    }

    const orderData = {
      _openid: wxContext.OPENID,
      orderNo,
      orderType,
      orderTypeText,
      sequence,
      tableNumber: tableNumber || '',
      items,
      totalPrice,
      remark,
      deliveryMode: finalDeliveryMode,
      addressId: addressId || '',
      status: 0,
      createTime: new Date().getTime(),
      updateTime: new Date().getTime(),
      timeoutAt: new Date().getTime() + ORDER_TIMEOUT
    }

    const res = await db.collection('orders').add({
      data: orderData
    })

    return {
      success: true,
      orderId: res._id,
      orderNo,
      orderType,
      sequence
    }
  } catch (err) {
    console.error('创建订单失败', err)
    return {
      success: false,
      message: '创建订单失败'
    }
  }
}

/**
 * 生成有序订单号
 * 规则：
 * - 桌号订单：T桌号-序号，如 T05-001（5号桌当日第1单）
 * - 自取订单：P序号，如 P001（当日第1个自取单）
 * - 外卖订单：D序号，如 D001（当日第1个外卖单）
 */
async function generateOrderNo(tableNumber, deliveryMode) {
  const today = getTodayDateString()
  
  // 确定订单类型
  let orderType
  let sequenceKey
  
  if (tableNumber && tableNumber !== '0' && tableNumber !== '未选择') {
    // 桌号订单
    orderType = ORDER_TYPE.TABLE
    sequenceKey = `table_${today}_${tableNumber}`
  } else if (deliveryMode === 'delivery') {
    // 外卖订单
    orderType = ORDER_TYPE.DELIVERY
    sequenceKey = `delivery_${today}`
  } else {
    // 自取订单
    orderType = ORDER_TYPE.PICKUP
    sequenceKey = `pickup_${today}`
  }
  
  // 获取当日序号
  const sequence = await getNextSequence(sequenceKey)
  const sequenceStr = sequence.toString().padStart(3, '0')
  
  // 生成订单号
  let orderNo
  if (orderType === ORDER_TYPE.TABLE) {
    const tableStr = tableNumber.toString().padStart(2, '0')
    orderNo = `${orderType}${tableStr}-${sequenceStr}`
  } else {
    orderNo = `${orderType}${sequenceStr}`
  }
  
  return { orderNo, orderType, sequence }
}

/**
 * 获取下一个序号（原子操作）
 */
async function getNextSequence(key) {
  const today = getTodayDateString()
  
  try {
    // 尝试获取今日计数器
    const counterRes = await db.collection('orderCounters').where({
      _id: key
    }).get()
    
    if (counterRes.data.length > 0) {
      // 更新计数器
      const updateRes = await db.collection('orderCounters').doc(counterRes.data[0]._id).update({
        data: {
          value: _.inc(1),
          updateTime: new Date().getTime()
        }
      })
      
      // 获取更新后的值
      const newRes = await db.collection('orderCounters').doc(counterRes.data[0]._id).get()
      return newRes.data.value
    } else {
      // 创建新的计数器
      await db.collection('orderCounters').add({
        data: {
          _id: key,
          value: 1,
          date: today,
          createTime: new Date().getTime(),
          updateTime: new Date().getTime()
        }
      })
      return 1
    }
  } catch (err) {
    console.error('获取序号失败', err)
    // 降级方案：使用时间戳作为序号
    return Math.floor(Date.now() / 1000) % 10000
  }
}

/**
 * 获取今日日期字符串 YYYYMMDD
 */
function getTodayDateString() {
  const now = new Date()
  const year = now.getFullYear()
  const month = (now.getMonth() + 1).toString().padStart(2, '0')
  const day = now.getDate().toString().padStart(2, '0')
  return `${year}${month}${day}`
}