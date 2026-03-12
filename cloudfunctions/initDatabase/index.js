const cloud = require('wx-server-sdk')
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const _ = db.command

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID
  const { force } = event

  try {
    // 检查是否已初始化
    const initializedKey = 'database_initialized'
    const configRes = await db.collection('config')
      .where({ key: initializedKey })
      .get()

    if (configRes.data.length > 0 && !force) {
      return {
        success: false,
        message: '数据库已初始化，如需重新初始化请传入 force: true',
        code: 'ALREADY_INITIALIZED'
      }
    }

    // 权限验证：只有商户才能初始化数据库
    const merchantCount = await db.collection('merchantWhitelist')
      .where({ status: 1 })
      .count()

    if (merchantCount.total > 0) {
      // 已有商户，验证权限
      const callerRes = await db.collection('merchantWhitelist')
        .where({ openid: openid, status: 1 })
        .get()

      if (callerRes.data.length === 0) {
        return {
          success: false,
          message: '无权限：只有商户才能初始化数据库',
          code: 'PERMISSION_DENIED'
        }
      }
    }

    // 执行初始化
    await initCategories()
    await initDishes()
    await initTables()
    await initShopInfo()
    await initOrderCounter()
    await markInitialized()

    return {
      success: true,
      message: '数据库初始化成功'
    }
  } catch (err) {
    console.error('数据库初始化失败', err)
    return {
      success: false,
      message: '数据库初始化失败: ' + err.message
    }
  }
}

async function initCategories() {
  // 先清空再添加
  const existing = await db.collection('categories').get()
  for (const item of existing.data) {
    await db.collection('categories').doc(item._id).remove()
  }

  const categories = [
    {
      name: '热菜',
      description: '精选热菜，美味可口',
      sort: 1,
      status: 1
    },
    {
      name: '凉菜',
      description: '清爽凉菜，开胃解腻',
      sort: 2,
      status: 1
    },
    {
      name: '主食',
      description: '丰富主食，营养均衡',
      sort: 3,
      status: 1
    },
    {
      name: '饮品',
      description: '特色饮品，清爽解渴',
      sort: 4,
      status: 1
    }
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
  // 先清空再添加
  const existing = await db.collection('dishes').get()
  for (const item of existing.data) {
    await db.collection('dishes').doc(item._id).remove()
  }

  const categoriesRes = await db.collection('categories').get()
  const categories = categoriesRes.data

  const dishesMap = {
    '热菜': [
      {
        name: '宫保鸡丁',
        description: '经典川菜，鸡肉鲜嫩，花生香脆',
        price: 38.00,
        spicyLevel: 3,
        isHot: true,
        isNew: false,
        sort: 1
      },
      {
        name: '麻婆豆腐',
        description: '麻辣鲜香，豆腐嫩滑',
        price: 28.00,
        spicyLevel: 4,
        isHot: true,
        isNew: false,
        sort: 2
      }
    ],
    '凉菜': [
      {
        name: '凉拌黄瓜',
        description: '清爽解腻，开胃下饭',
        price: 18.00,
        spicyLevel: 1,
        isHot: false,
        isNew: false,
        sort: 1
      }
    ],
    '主食': [
      {
        name: '米饭',
        description: '优质大米，香软可口',
        price: 2.00,
        spicyLevel: 0,
        isHot: false,
        isNew: false,
        sort: 1
      },
      {
        name: '蛋炒饭',
        description: '经典蛋炒饭，粒粒分明',
        price: 15.00,
        spicyLevel: 0,
        isHot: false,
        isNew: false,
        sort: 2
      }
    ],
    '饮品': [
      {
        name: '酸梅汤',
        description: '酸甜解渴，清热降火',
        price: 8.00,
        spicyLevel: 0,
        isHot: true,
        isNew: false,
        sort: 1
      },
      {
        name: '柠檬水',
        description: '清新柠檬，维C满满',
        price: 6.00,
        spicyLevel: 0,
        isHot: false,
        isNew: true,
        sort: 2
      }
    ]
  }

  for (const category of categories) {
    const dishes = dishesMap[category.name] || []
    for (const dish of dishes) {
      await db.collection('dishes').add({
        data: {
          ...dish,
          categoryId: category._id,
          status: 1,
          createTime: Date.now(),
          updateTime: Date.now()
        }
      })
    }
  }
}

async function initTables() {
  // 先清空再添加
  const existing = await db.collection('tables').get()
  for (const item of existing.data) {
    await db.collection('tables').doc(item._id).remove()
  }

  for (let i = 1; i <= 20; i++) {
    await db.collection('tables').add({
      data: {
        tableNumber: String(i),
        status: 0, // 空闲
        createTime: Date.now(),
        updateTime: Date.now()
      }
    })
  }
}

async function initShopInfo() {
  // 先清空再添加
  const existing = await db.collection('shopInfo').get()
  for (const item of existing.data) {
    await db.collection('shopInfo').doc(item._id).remove()
  }

  await db.collection('shopInfo').add({
    data: {
      name: '私房菜馆',
      address: 'XX市XX区XX路XX号',
      phone: '138-XXXX-XXXX',
      businessHours: '10:00-22:00',
      description: '用心做好每一道菜',
      autoAcceptOrder: false,
      createTime: Date.now(),
      updateTime: Date.now()
    }
  })
}

async function initOrderCounter() {
  // 创建订单计数器集合（如果不存在）
  try {
    await db.collection('orderCounters').limit(1).get()
  } catch (err) {
    // 集合不存在，创建一个初始文档
    await db.collection('orderCounters').add({
      data: {
        _id: 'init',
        value: 0,
        createTime: Date.now()
      }
    })
  }
}

async function markInitialized() {
  // 标记已初始化
  try {
    await db.collection('config').add({
      data: {
        key: 'database_initialized',
        value: true,
        createTime: Date.now()
      }
    })
  } catch (err) {
    // config 集合可能不存在，先创建
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