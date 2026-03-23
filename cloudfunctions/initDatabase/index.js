const cloud = require('wx-server-sdk')
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const _ = db.command

// 需要创建的集合列表
const REQUIRED_COLLECTIONS = [
  'users',
  'merchantWhitelist',
  'orders',
  'dishes',
  'categories',
  'tables',
  'shopInfo',
  'banners',
  'orderCounters',
  'config',
  'refundLogs',
  'addresses'
]

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID
  const { force, firstTime, testOrders } = event

  try {
    // 先确保所有必要集合存在
    const collectionResults = await ensureCollections()

    const initializedKey = 'database_initialized'
    const configRes = await db.collection('config')
      .where({ key: initializedKey })
      .get()

    if (configRes.data.length > 0 && !force) {
      return {
        success: false,
        message: '数据库已初始化，如需重新初始化请传入 force: true',
        code: 'ALREADY_INITIALIZED',
        collections: collectionResults
      }
    }

    // 权限检查：首次初始化跳过权限验证
    if (!firstTime) {
      const merchantCount = await db.collection('merchantWhitelist')
        .where({ status: 1 })
        .count()

      if (merchantCount.total > 0) {
        const callerRes = await db.collection('merchantWhitelist')
          .where({ openid: openid, status: 1 })
          .get()

        if (callerRes.data.length === 0) {
          return {
            success: false,
            message: '无权限：只有商户才能初始化数据库',
            code: 'PERMISSION_DENIED',
            collections: collectionResults
          }
        }
      }
    }

    // 初始化数据
    await initCategories()
    await initDishes()
    await initTables()
    await initShopInfo()
    await initBanners()
    await initOrderCounter()
    
    // 初始化测试订单（可选）
    if (testOrders) {
      await initTestOrders()
    }
    
    // 首次初始化时，自动将调用者添加为商户
    if (firstTime || force) {
      await addFirstMerchant(openid)
    }
    
    await markInitialized()

    return {
      success: true,
      message: '数据库初始化成功',
      collections: collectionResults
    }
  } catch (err) {
    console.error('数据库初始化失败', err)
    return {
      success: false,
      message: '数据库初始化失败: ' + err.message
    }
  }
}

// 添加首个商户
async function addFirstMerchant(openid) {
  if (!openid) return
  
  const existing = await db.collection('merchantWhitelist')
    .where({ openid })
    .get()
  
  if (existing.data.length === 0) {
    await db.collection('merchantWhitelist').add({
      data: {
        openid,
        status: 1,
        createTime: Date.now()
      }
    })
    console.log('已将调用者添加为商户:', openid)
  }
}

// 清空集合并重新创建（更高效）
async function clearCollection(collectionName) {
  try {
    // 删除整个集合并重新创建
    await db.collection(collectionName).where({
      _id: _.exists(true)
    }).remove()
  } catch (err) {
    console.log(`清空集合 ${collectionName} 时出错，继续执行:`, err.message)
  }
}

async function initCategories() {
  await clearCollection('categories')

  const categories = [
    { name: '招牌推荐', description: '镇店之宝，必点美味', emoji: '⭐', sort: 1, status: 1 },
    { name: '热销菜品', description: '人气爆款，深受喜爱', emoji: '🔥', sort: 2, status: 1 },
    { name: '海鲜美食', description: '新鲜海鲜，鲜活直供', emoji: '🦐', sort: 3, status: 1 },
    { name: '经典热菜', description: '经典口味，回味无穷', emoji: '🍲', sort: 4, status: 1 },
    { name: '爽口凉菜', description: '清凉爽口，开胃解腻', emoji: '🥗', sort: 5, status: 1 },
    { name: '营养主食', description: '精选主食，饱腹之选', emoji: '🍚', sort: 6, status: 1 },
    { name: '美味小吃', description: '特色小吃，口口留香', emoji: '🥟', sort: 7, status: 1 },
    { name: '鲜榨饮品', description: '新鲜水果，现榨现卖', emoji: '🥤', sort: 8, status: 1 }
  ]

  for (const category of categories) {
    await db.collection('categories').add({
      data: {
        ...category,
        createTime: Date.now(),
        updateTime: Date.now()
      }
    })
  }
}

async function initDishes() {
  await clearCollection('dishes')

  const categoriesRes = await db.collection('categories').get()
  const categoryMap = {}
  categoriesRes.data.forEach(cat => {
    categoryMap[cat.name] = cat._id
  })

  const dishesData = {
    '招牌推荐': [
      { name: '秘制红烧肉', description: '精选五花肉，肥而不腻，入口即化，秘制酱汁慢炖三小时', price: 68.00, emoji: '🥩', image: '', spicyLevel: 0, isHot: true, isNew: false, sort: 1 },
      { name: '蒜蓉粉丝蒸扇贝', description: '新鲜扇贝配以蒜蓉粉丝，鲜嫩多汁', price: 58.00, emoji: '🦪', image: '', spicyLevel: 0, isHot: true, isNew: false, sort: 2 },
      { name: '避风塘炒蟹', description: '经典港式做法，蒜香浓郁，蟹肉鲜甜', price: 128.00, emoji: '🦀', image: '', spicyLevel: 2, isHot: true, isNew: true, sort: 3 },
      { name: '招牌脆皮鸡', description: '外酥里嫩，皮脆肉滑，配上特制酱料', price: 88.00, emoji: '🍗', image: '', spicyLevel: 0, isHot: true, isNew: false, sort: 4 }
    ],
    '热销菜品': [
      { name: '麻辣小龙虾', description: '精选鲜活小龙虾，麻辣鲜香，吮指回味', price: 98.00, emoji: '🦞', image: '', spicyLevel: 4, isHot: true, isNew: false, sort: 1 },
      { name: '酸菜鱼', description: '鱼片鲜嫩，酸菜爽口，汤浓味美', price: 68.00, emoji: '🐟', image: '', spicyLevel: 2, isHot: true, isNew: false, sort: 2 },
      { name: '水煮牛肉', description: '牛肉嫩滑，麻辣过瘾，配菜丰富', price: 58.00, emoji: '🥩', image: '', spicyLevel: 4, isHot: true, isNew: false, sort: 3 },
      { name: '干锅花菜', description: '花菜脆嫩，五花肉提香，干锅风味', price: 32.00, emoji: '🥦', image: '', spicyLevel: 2, isHot: true, isNew: false, sort: 4 },
      { name: '糖醋里脊', description: '外酥里嫩，酸甜可口，老少皆宜', price: 38.00, emoji: '🍖', image: '', spicyLevel: 0, isHot: true, isNew: false, sort: 5 }
    ],
    '海鲜美食': [
      { name: '清蒸石斑鱼', description: '新鲜石斑鱼，清蒸保留原味', price: 138.00, emoji: '🐟', image: '', spicyLevel: 0, isHot: false, isNew: false, sort: 1 },
      { name: '椒盐皮皮虾', description: '皮皮虾肉质鲜甜，椒盐风味', price: 88.00, emoji: '🦐', image: '', spicyLevel: 2, isHot: true, isNew: false, sort: 2 },
      { name: '白灼基围虾', description: '新鲜基围虾白灼，蘸料鲜美', price: 78.00, emoji: '🦐', image: '', spicyLevel: 0, isHot: false, isNew: false, sort: 3 },
      { name: '蒜蓉蒸生蚝', description: '生蚝肥美，蒜蓉提鲜', price: 12.00, emoji: '🦪', image: '', spicyLevel: 0, isHot: true, isNew: true, sort: 4 },
      { name: '香辣蟹', description: '螃蟹配以香辣调料，鲜香麻辣', price: 108.00, emoji: '🦀', image: '', spicyLevel: 3, isHot: false, isNew: false, sort: 5 }
    ],
    '经典热菜': [
      { name: '宫保鸡丁', description: '经典川菜，鸡肉鲜嫩，花生香脆', price: 38.00, emoji: '🍗', image: '', spicyLevel: 2, isHot: true, isNew: false, sort: 1 },
      { name: '麻婆豆腐', description: '麻辣鲜香，豆腐嫩滑，下饭神器', price: 28.00, emoji: '🥘', image: '', spicyLevel: 3, isHot: true, isNew: false, sort: 2 },
      { name: '鱼香肉丝', description: '酸甜微辣，肉丝嫩滑，配菜丰富', price: 32.00, emoji: '🥢', image: '', spicyLevel: 1, isHot: true, isNew: false, sort: 3 },
      { name: '红烧茄子', description: '茄子软糯，酱香浓郁', price: 26.00, emoji: '🍆', image: '', spicyLevel: 0, isHot: false, isNew: false, sort: 4 },
      { name: '干煸四季豆', description: '四季豆酥脆，肉末提香', price: 28.00, emoji: '🥬', image: '', spicyLevel: 1, isHot: false, isNew: false, sort: 5 },
      { name: '番茄炒蛋', description: '家常美味，酸甜可口', price: 22.00, emoji: '🍅', image: '', spicyLevel: 0, isHot: false, isNew: false, sort: 6 }
    ],
    '爽口凉菜': [
      { name: '凉拌黄瓜', description: '清爽解腻，蒜香四溢', price: 16.00, emoji: '🥒', image: '', spicyLevel: 1, isHot: true, isNew: false, sort: 1 },
      { name: '皮蛋豆腐', description: '皮蛋配嫩豆腐，清凉爽口', price: 18.00, emoji: '🥚', image: '', spicyLevel: 0, isHot: false, isNew: false, sort: 2 },
      { name: '凉拌木耳', description: '木耳爽脆，酸辣开胃', price: 18.00, emoji: '🍄', image: '', spicyLevel: 1, isHot: false, isNew: false, sort: 3 },
      { name: '口水鸡', description: '麻辣鲜香，鸡肉嫩滑', price: 38.00, emoji: '🍗', image: '', spicyLevel: 3, isHot: true, isNew: false, sort: 4 },
      { name: '蒜泥白肉', description: '五花肉薄片，蒜泥调味', price: 36.00, emoji: '🥩', image: '', spicyLevel: 2, isHot: false, isNew: false, sort: 5 }
    ],
    '营养主食': [
      { name: '招牌蛋炒饭', description: '粒粒分明，蛋香四溢', price: 18.00, emoji: '🍳', image: '', spicyLevel: 0, isHot: true, isNew: false, sort: 1 },
      { name: '扬州炒饭', description: '虾仁、火腿、蛋花，料足味美', price: 28.00, emoji: '🍚', image: '', spicyLevel: 0, isHot: true, isNew: false, sort: 2 },
      { name: '海鲜粥', description: '新鲜海鲜熬制，鲜香浓郁', price: 38.00, emoji: '🥣', image: '', spicyLevel: 0, isHot: false, isNew: false, sort: 3 },
      { name: '白米饭', description: '东北大米，香软可口', price: 3.00, emoji: '🍚', image: '', spicyLevel: 0, isHot: false, isNew: false, sort: 4 },
      { name: '担担面', description: '麻辣鲜香，肉臊浓郁', price: 22.00, emoji: '🍜', image: '', spicyLevel: 2, isHot: false, isNew: true, sort: 5 }
    ],
    '美味小吃': [
      { name: '手工水饺', description: '新鲜手工包制，皮薄馅大', price: 28.00, emoji: '🥟', image: '', spicyLevel: 0, isHot: true, isNew: false, sort: 1 },
      { name: '锅贴', description: '底部焦脆，肉馅鲜美', price: 18.00, emoji: '🥟', image: '', spicyLevel: 0, isHot: false, isNew: false, sort: 2 },
      { name: '春卷', description: '外酥里嫩，内馅丰富', price: 12.00, emoji: '🌯', image: '', spicyLevel: 0, isHot: false, isNew: false, sort: 3 },
      { name: '炸鸡块', description: '外酥里嫩，金黄诱人', price: 22.00, emoji: '🍗', image: '', spicyLevel: 0, isHot: true, isNew: false, sort: 4 },
      { name: '薯条', description: '酥脆可口，配番茄酱', price: 15.00, emoji: '🍟', image: '', spicyLevel: 0, isHot: false, isNew: false, sort: 5 }
    ],
    '鲜榨饮品': [
      { name: '鲜榨西瓜汁', description: '新鲜西瓜现榨，清凉解暑', price: 12.00, emoji: '🍉', image: '', spicyLevel: 0, isHot: true, isNew: false, sort: 1 },
      { name: '芒果冰沙', description: '新鲜芒果制作，口感细腻', price: 18.00, emoji: '🥭', image: '', spicyLevel: 0, isHot: true, isNew: false, sort: 2 },
      { name: '柠檬蜂蜜水', description: '鲜柠檬配蜂蜜，酸甜解渴', price: 10.00, emoji: '🍋', image: '', spicyLevel: 0, isHot: false, isNew: false, sort: 3 },
      { name: '酸梅汤', description: '传统秘制，酸甜解腻', price: 8.00, emoji: '🥤', image: '', spicyLevel: 0, isHot: true, isNew: false, sort: 4 },
      { name: '椰汁', description: '新鲜椰子，天然清甜', price: 15.00, emoji: '🥥', image: '', spicyLevel: 0, isHot: false, isNew: true, sort: 5 }
    ]
  }

  for (const [categoryName, dishes] of Object.entries(dishesData)) {
    const categoryId = categoryMap[categoryName]
    if (!categoryId) continue

    for (const dish of dishes) {
      await db.collection('dishes').add({
        data: {
          ...dish,
          categoryId,
          status: 1,
          createTime: Date.now(),
          updateTime: Date.now()
        }
      })
    }
  }
}

async function initTables() {
  await clearCollection('tables')

  for (let i = 1; i <= 20; i++) {
    await db.collection('tables').add({
      data: {
        tableNumber: String(i),
        capacity: i <= 4 ? 2 : (i <= 12 ? 4 : 6),
        status: 0,
        currentOrderId: '',      // 当前订单ID
        orderTime: null,         // 开台时间
        qrCode: '',              // 二维码URL
        createTime: Date.now(),
        updateTime: Date.now()
      }
    })
  }
}

async function initShopInfo() {
  await clearCollection('shopInfo')

  await db.collection('shopInfo').add({
    data: {
      name: '平潭礼物餐厅',
      logo: '',
      address: '福建省福州市平潭县君山镇北港村新门前16号',
      phone: '181-5919-5897',
      businessHours: '10:00-22:00',
      description: '平潭特色美食，新鲜海鲜，地道风味。用心做好每一道菜，让您品尝最纯正的海岛味道。',
      latitude: 25.5067,
      longitude: 119.7956,
      autoAcceptOrder: false,
      deliveryFee: 5,
      minOrderAmount: 20,
      packagingFee: 2,
      createTime: Date.now(),
      updateTime: Date.now()
    }
  })
}

async function initBanners() {
  await clearCollection('banners')

  const banners = [
    { title: '新店开业', desc: '全场8折优惠，欢迎光临', image: '/images/banner/banner1.jpg', sort: 1, status: 1 },
    { title: '招牌推荐', desc: '秘制红烧肉，限时特惠', image: '/images/banner/banner2.jpg', sort: 2, status: 1 },
    { title: '海鲜盛宴', desc: '新鲜海鲜，鲜活直供', image: '/images/banner/banner3.jpg', sort: 3, status: 1 },
    { title: '会员福利', desc: '注册会员享专属优惠', image: '/images/banner/banner4.jpg', sort: 4, status: 1 }
  ]

  for (const banner of banners) {
    await db.collection('banners').add({
      data: {
        ...banner,
        createTime: Date.now(),
        updateTime: Date.now()
      }
    })
  }
}

async function initOrderCounter() {
  await clearCollection('orderCounters')
}

async function initTestOrders() {
  await clearCollection('orders')

  // 获取当前用户 openid（真实用户）
  const wxContext = cloud.getWXContext()
  const realOpenid = wxContext.OPENID

  // 获取桌号 ID 映射
  const tablesRes = await db.collection('tables').get()
  const tableMap = {}
  tablesRes.data.forEach(t => {
    tableMap[t.tableNumber] = t._id
  })

  // 获取菜品 ID 映射
  const dishesRes = await db.collection('dishes').get()
  const dishMap = {}
  dishesRes.data.forEach(d => {
    dishMap[d.name] = d._id
  })

  const testOrders = [
    {
      _openid: realOpenid,
      orderNo: 'T01-001',
      orderType: 'T',
      orderTypeText: '桌号订单',
      sequence: 1,
      tableNumber: '1',
      tableId: tableMap['1'] || '',
      items: [
        { dishId: dishMap['秘制红烧肉'] || 'test_1', name: '秘制红烧肉', price: 68, quantity: 1, image: '' },
        { dishId: dishMap['蒜蓉粉丝蒸扇贝'] || 'test_2', name: '蒜蓉粉丝蒸扇贝', price: 58, quantity: 2, image: '' }
      ],
      totalPrice: 184,
      remark: '少放辣',
      deliveryMode: 'dine-in',
      status: 1,  // 待接单
      createTime: Date.now() - 3600000,
      updateTime: Date.now() - 3600000,
      userNickName: '测试用户',
      userAvatarUrl: ''
    },
    {
      _openid: realOpenid,
      orderNo: 'P001',
      orderType: 'P',
      orderTypeText: '自取订单',
      sequence: 1,
      tableNumber: '',
      tableId: '',
      items: [
        { dishId: dishMap['麻辣小龙虾'] || 'test_3', name: '麻辣小龙虾', price: 98, quantity: 1, image: '' },
        { dishId: dishMap['招牌蛋炒饭'] || 'test_4', name: '招牌蛋炒饭', price: 18, quantity: 2, image: '' }
      ],
      totalPrice: 134,
      remark: '',
      deliveryMode: 'pickup',
      status: 2,  // 制作中
      createTime: Date.now() - 7200000,
      updateTime: Date.now() - 3600000,
      acceptTime: Date.now() - 3500000,
      userNickName: '测试用户',
      userAvatarUrl: ''
    },
    {
      _openid: realOpenid,
      orderNo: 'D001',
      orderType: 'D',
      orderTypeText: '外卖订单',
      sequence: 1,
      tableNumber: '',
      tableId: '',
      items: [
        { dishId: dishMap['酸菜鱼'] || 'test_5', name: '酸菜鱼', price: 68, quantity: 1, image: '' }
      ],
      totalPrice: 73,
      remark: '多加酸菜',
      deliveryMode: 'delivery',
      addressId: '',
      status: 0,  // 待支付
      createTime: Date.now() - 1800000,
      updateTime: Date.now() - 1800000,
      timeoutAt: Date.now() + 720000,
      userNickName: '测试用户',
      userAvatarUrl: ''
    },
    {
      _openid: realOpenid,
      orderNo: 'T05-002',
      orderType: 'T',
      orderTypeText: '桌号订单',
      sequence: 2,
      tableNumber: '5',
      tableId: tableMap['5'] || '',
      items: [
        { dishId: dishMap['清蒸石斑鱼'] || 'test_6', name: '清蒸石斑鱼', price: 138, quantity: 1, image: '' },
        { dishId: dishMap['白灼基围虾'] || 'test_7', name: '白灼基围虾', price: 78, quantity: 1, image: '' }
      ],
      totalPrice: 216,
      remark: '',
      deliveryMode: 'dine-in',
      status: 3,  // 已完成
      createTime: Date.now() - 5400000,
      updateTime: Date.now() - 1800000,
      acceptTime: Date.now() - 5200000,
      completeTime: Date.now() - 1800000,
      userNickName: '测试用户',
      userAvatarUrl: ''
    }
  ]

  for (const order of testOrders) {
    await db.collection('orders').add({ data: order })
  }

  // 更新桌号状态（1号桌有订单）
  if (tableMap['1']) {
    const order1 = testOrders.find(o => o.tableNumber === '1')
    await db.collection('tables').doc(tableMap['1']).update({
      data: { status: 1, currentOrderId: order1._id || '' }
    })
  }
}

async function markInitialized() {
  try {
    await db.collection('config').add({
      data: {
        key: 'database_initialized',
        value: true,
        createTime: Date.now()
      }
    })
  } catch (err) {
    await db.createCollection('config').catch(() => {})
    await db.collection('config').add({
      data: {
        key: 'database_initialized',
        value: true,
        createTime: Date.now()
      }
    })
  }
}

// 确保所有必要集合存在
async function ensureCollections() {
  const results = []
  for (const collectionName of REQUIRED_COLLECTIONS) {
    try {
      // 尝试查询集合，检查是否存在
      await db.collection(collectionName).limit(1).get()
      results.push({ name: collectionName, status: 'exists' })
    } catch (err) {
      // 集合不存在，尝试创建
      if (err.errMsg && err.errMsg.includes('collection')) {
        try {
          await db.createCollection(collectionName)
          results.push({ name: collectionName, status: 'created' })
          console.log(`集合 ${collectionName} 创建成功`)
        } catch (createErr) {
          results.push({ name: collectionName, status: 'failed', error: createErr.message })
          console.error(`创建集合 ${collectionName} 失败:`, createErr)
        }
      }
    }
  }
  return results
}