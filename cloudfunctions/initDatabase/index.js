const cloud = require('wx-server-sdk')
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

exports.main = async (event, context) => {
  try {
    await initCategories()
    await initDishes()
    await initTables()
    await initShopInfo()
    await initMerchantWhitelist()

    return {
      success: true,
      message: '数据库初始化成功'
    }
  } catch (err) {
    console.error('数据库初始化失败', err)
    return {
      success: false,
      message: '数据库初始化失败'
    }
  }
}

async function initCategories() {
  const categories = [
    {
      name: '热菜',
      description: '精选热菜，美味可口',
      image: 'https://example.com/category-hot.jpg',
      sort: 1,
      status: 1
    },
    {
      name: '凉菜',
      description: '清爽凉菜，开胃解腻',
      image: 'https://example.com/category-cold.jpg',
      sort: 2,
      status: 1
    },
    {
      name: '主食',
      description: '丰富主食，营养均衡',
      image: 'https://example.com/category-staple.jpg',
      sort: 3,
      status: 1
    },
    {
      name: '饮品',
      description: '特色饮品，清爽解渴',
      image: 'https://example.com/category-drink.jpg',
      sort: 4,
      status: 1
    }
  ]

  for (const category of categories) {
    await db.collection('categories').add({
      data: {
        ...category,
        createTime: new Date().getTime(),
        updateTime: new Date().getTime()
      }
    })
  }
}

async function initDishes() {
  const categoriesRes = await db.collection('categories').get()
  const categories = categoriesRes.data

  const dishesMap = {
    '热菜': [
      {
        name: '宫保鸡丁',
        description: '经典川菜，鸡肉鲜嫩，花生香脆',
        price: 38.00,
        ingredients: '鸡肉、花生、辣椒、葱',
        spicyLevel: 3,
        isHot: true,
        isNew: false,
        sort: 1
      },
      {
        name: '麻婆豆腐',
        description: '麻辣鲜香，豆腐嫩滑',
        price: 28.00,
        ingredients: '豆腐、肉末、豆瓣酱',
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
        ingredients: '黄瓜、蒜、醋',
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
        ingredients: '大米',
        spicyLevel: 0,
        isHot: false,
        isNew: false,
        sort: 1
      },
      {
        name: '蛋炒饭',
        description: '经典蛋炒饭，粒粒分明',
        price: 15.00,
        ingredients: '米饭、鸡蛋、葱',
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
        ingredients: '乌梅、山楂、冰糖',
        spicyLevel: 0,
        isHot: true,
        isNew: false,
        sort: 1
      },
      {
        name: '柠檬水',
        description: '清新柠檬，维C满满',
        price: 6.00,
        ingredients: '柠檬、水、蜂蜜',
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
          image: `https://example.com/dish-${dish.name}.jpg`,
          status: 1,
          createTime: new Date().getTime(),
          updateTime: new Date().getTime()
        }
      })
    }
  }
}

async function initTables() {
  const tables = []
  for (let i = 1; i <= 20; i++) {
    tables.push({
      tableNumber: `${i}号桌`,
      qrCode: `https://example.com/qr/table-${i}.png`,
      status: 1
    })
  }

  for (const table of tables) {
    await db.collection('tables').add({
      data: {
        ...table,
        createTime: new Date().getTime(),
        updateTime: new Date().getTime()
      }
    })
  }
}

async function initShopInfo() {
  await db.collection('shopInfo').add({
    data: {
      name: '私房菜馆',
      logo: 'https://example.com/shop-logo.png',
      address: 'XX市XX区XX路XX号',
      phone: '138-XXXX-XXXX',
      businessHours: '10:00-22:00',
      description: '用心做好每一道菜',
      createTime: new Date().getTime(),
      updateTime: new Date().getTime()
    }
  })
}

async function initMerchantWhitelist() {
  const existRes = await db.collection('merchantWhitelist').limit(1).get()
  if (existRes.data.length > 0) {
    console.log('商户白名单已存在，跳过初始化')
    return
  }
  
  await db.collection('merchantWhitelist').add({
    data: {
      openid: '请在数据库中添加商户openid',
      nickname: '示例商户',
      status: 1,
      createTime: new Date().getTime(),
      updateTime: new Date().getTime()
    }
  })
}