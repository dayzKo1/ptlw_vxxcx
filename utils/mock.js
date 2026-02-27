function isDevMode() {
  try {
    return typeof __wxConfig !== 'undefined' && __wxConfig.envVersion !== 'release'
  } catch (e) {
    return true
  }
}

var mockOrders = [
  {
    _id: 'order_001',
    orderNo: '20260227001',
    status: 0,
    tableNumber: 'A01',
    items: [
      { dishId: 'd1', name: '招牌红烧肉', quantity: 1, price: 68 },
      { dishId: 'd2', name: '米饭', quantity: 2, price: 5 }
    ],
    totalPrice: 78,
    remark: '少放辣椒',
    createTime: Date.now() - 1800000
  },
  {
    _id: 'order_002',
    orderNo: '20260227002',
    status: 1,
    tableNumber: 'A02',
    items: [
      { dishId: 'd3', name: '宫保鸡丁', quantity: 1, price: 48 },
      { dishId: 'd4', name: '酸辣土豆丝', quantity: 1, price: 28 },
      { dishId: 'd2', name: '米饭', quantity: 2, price: 5 }
    ],
    totalPrice: 86,
    remark: '',
    createTime: Date.now() - 3600000
  },
  {
    _id: 'order_003',
    orderNo: '20260227003',
    status: 2,
    tableNumber: 'B01',
    items: [
      { dishId: 'd5', name: '水煮鱼', quantity: 1, price: 88 },
      { dishId: 'd6', name: '蒜蓉西兰花', quantity: 1, price: 32 }
    ],
    totalPrice: 120,
    remark: '鱼要新鲜的',
    createTime: Date.now() - 5400000
  },
  {
    _id: 'order_004',
    orderNo: '20260227004',
    status: 3,
    tableNumber: 'B02',
    items: [
      { dishId: 'd7', name: '麻婆豆腐', quantity: 2, price: 36 },
      { dishId: 'd2', name: '米饭', quantity: 3, price: 5 }
    ],
    totalPrice: 87,
    remark: '',
    createTime: Date.now() - 7200000
  },
  {
    _id: 'order_005',
    orderNo: '20260227005',
    status: 0,
    tableNumber: 'C01',
    items: [
      { dishId: 'd8', name: '糖醋排骨', quantity: 1, price: 58 },
      { dishId: 'd9', name: '番茄蛋汤', quantity: 1, price: 22 }
    ],
    totalPrice: 80,
    remark: '排骨多放糖',
    createTime: Date.now() - 900000
  },
  {
    _id: 'order_006',
    orderNo: '20260227006',
    status: 1,
    tableNumber: 'C02',
    items: [
      { dishId: 'd10', name: '回锅肉', quantity: 1, price: 52 },
      { dishId: 'd11', name: '干煸四季豆', quantity: 1, price: 28 }
    ],
    totalPrice: 80,
    remark: '',
    createTime: Date.now() - 2700000
  },
  {
    _id: 'order_007',
    orderNo: '20260227007',
    status: 4,
    tableNumber: 'A03',
    items: [
      { dishId: 'd12', name: '鱼香肉丝', quantity: 1, price: 42 }
    ],
    totalPrice: 42,
    remark: '顾客取消',
    createTime: Date.now() - 10800000
  },
  {
    _id: 'order_008',
    orderNo: '20260227008',
    status: 2,
    tableNumber: 'D01',
    items: [
      { dishId: 'd1', name: '招牌红烧肉', quantity: 2, price: 68 },
      { dishId: 'd5', name: '水煮鱼', quantity: 1, price: 88 },
      { dishId: 'd2', name: '米饭', quantity: 4, price: 5 }
    ],
    totalPrice: 244,
    remark: '公司聚餐',
    createTime: Date.now() - 4500000
  }
]

var mockDishes = [
  {
    _id: 'd1',
    name: '招牌红烧肉',
    price: 68,
    description: '精选五花肉，肥而不腻，入口即化',
    categoryId: '1',
    image: '/images/dishes/hongshaorou.png',
    spicyLevel: 1,
    isHot: true,
    isNew: false,
    status: 1,
    sort: 1
  },
  {
    _id: 'd2',
    name: '米饭',
    price: 5,
    description: '东北优质大米',
    categoryId: '3',
    image: '',
    spicyLevel: 0,
    isHot: false,
    isNew: false,
    status: 1,
    sort: 100
  },
  {
    _id: 'd3',
    name: '宫保鸡丁',
    price: 48,
    description: '经典川菜，鸡肉嫩滑，花生酥脆',
    categoryId: '1',
    image: '/images/dishes/gongbaojiding.png',
    spicyLevel: 2,
    isHot: true,
    isNew: false,
    status: 1,
    sort: 2
  },
  {
    _id: 'd4',
    name: '酸辣土豆丝',
    price: 28,
    description: '清脆爽口，酸辣开胃',
    categoryId: '2',
    image: '/images/dishes/tudousi.png',
    spicyLevel: 1,
    isHot: false,
    isNew: true,
    status: 1,
    sort: 10
  },
  {
    _id: 'd5',
    name: '水煮鱼',
    price: 88,
    description: '鲜嫩鱼片，麻辣鲜香',
    categoryId: '1',
    image: '/images/dishes/shuizhuyu.png',
    spicyLevel: 3,
    isHot: true,
    isNew: false,
    status: 1,
    sort: 3
  },
  {
    _id: 'd6',
    name: '蒜蓉西兰花',
    price: 32,
    description: '健康素食，清淡营养',
    categoryId: '2',
    image: '/images/dishes/xilanhua.png',
    spicyLevel: 0,
    isHot: false,
    isNew: false,
    status: 1,
    sort: 11
  },
  {
    _id: 'd7',
    name: '麻婆豆腐',
    price: 36,
    description: '麻辣鲜香，下饭神器',
    categoryId: '1',
    image: '/images/dishes/mapodoufu.png',
    spicyLevel: 2,
    isHot: false,
    isNew: false,
    status: 1,
    sort: 4
  },
  {
    _id: 'd8',
    name: '糖醋排骨',
    price: 58,
    description: '酸甜可口，外酥里嫩',
    categoryId: '1',
    image: '/images/dishes/tangcupaigu.png',
    spicyLevel: 0,
    isHot: true,
    isNew: true,
    status: 1,
    sort: 5
  },
  {
    _id: 'd9',
    name: '番茄蛋汤',
    price: 22,
    description: '家常美味，营养丰富',
    categoryId: '3',
    image: '/images/dishes/fanqiedantang.png',
    spicyLevel: 0,
    isHot: false,
    isNew: false,
    status: 1,
    sort: 50
  },
  {
    _id: 'd10',
    name: '回锅肉',
    price: 52,
    description: '川菜经典，肥瘦相间',
    categoryId: '1',
    image: '/images/dishes/huiguorou.png',
    spicyLevel: 2,
    isHot: true,
    isNew: false,
    status: 1,
    sort: 6
  },
  {
    _id: 'd11',
    name: '干煸四季豆',
    price: 28,
    description: '香脆可口，下饭佳品',
    categoryId: '2',
    image: '/images/dishes/sijidou.png',
    spicyLevel: 1,
    isHot: false,
    isNew: false,
    status: 1,
    sort: 12
  },
  {
    _id: 'd12',
    name: '鱼香肉丝',
    price: 42,
    description: '酸甜微辣，经典川菜',
    categoryId: '1',
    image: '/images/dishes/yuxiangrousi.png',
    spicyLevel: 1,
    isHot: false,
    isNew: true,
    status: 1,
    sort: 7
  },
  {
    _id: 'd13',
    name: '口水鸡',
    price: 48,
    description: '麻辣鲜香，川味凉菜',
    categoryId: '2',
    image: '/images/dishes/koushuiji.png',
    spicyLevel: 3,
    isHot: false,
    isNew: false,
    status: 0,
    sort: 13
  },
  {
    _id: 'd14',
    name: '扬州炒饭',
    price: 28,
    description: '粒粒分明，配料丰富',
    categoryId: '3',
    image: '/images/dishes/chaofan.png',
    spicyLevel: 0,
    isHot: false,
    isNew: false,
    status: 0,
    sort: 51
  }
]

var mockTables = [
  { _id: 't1', tableNumber: '1号桌', qrCode: '', status: 1 },
  { _id: 't2', tableNumber: '2号桌', qrCode: 'https://via.placeholder.com/200?text=QR-2', status: 1 },
  { _id: 't3', tableNumber: '3号桌', qrCode: 'https://via.placeholder.com/200?text=QR-3', status: 1 },
  { _id: 't4', tableNumber: '4号桌', qrCode: '', status: 1 },
  { _id: 't5', tableNumber: '5号桌', qrCode: 'https://via.placeholder.com/200?text=QR-5', status: 1 },
  { _id: 't6', tableNumber: '6号桌', qrCode: '', status: 1 },
  { _id: 't7', tableNumber: '7号桌', qrCode: 'https://via.placeholder.com/200?text=QR-7', status: 1 },
  { _id: 't8', tableNumber: '8号桌', qrCode: '', status: 1 },
  { _id: 't9', tableNumber: '包间A', qrCode: 'https://via.placeholder.com/200?text=QR-A', status: 1 },
  { _id: 't10', tableNumber: '包间B', qrCode: '', status: 1 }
]

var mockCategories = [
  { _id: '1', name: '热菜', sort: 1, status: 1 },
  { _id: '2', name: '凉菜', sort: 2, status: 1 },
  { _id: '3', name: '主食', sort: 3, status: 1 },
  { _id: '4', name: '饮品', sort: 4, status: 1 }
]

module.exports = {
  isDevMode: isDevMode,
  orders: mockOrders,
  dishes: mockDishes,
  tables: mockTables,
  categories: mockCategories
}