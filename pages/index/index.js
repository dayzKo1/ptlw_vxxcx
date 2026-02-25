const app = getApp()

Page({
  data: {
    shopInfo: {},
    hotDishes: [],
    categories: [],
    banners: [],
    tableNumber: '',
    showTableSelector: false,
    tables: []
  },

  onLoad() {
    this.setData({
      shopInfo: app.globalData.shopInfo
    })
    this.loadHotDishes()
    this.loadCategories()
    this.loadBanners()
    this.loadTableNumber()
    this.loadTables()
  },

  async loadHotDishes() {
    try {
      const db = wx.cloud.database()
      const res = await db.collection('dishes')
        .where({ isHot: true, status: 1 })
        .limit(10)
        .get()
      this.setData({ hotDishes: res.data })
    } catch (err) {
      console.error('加载热门菜品失败', err)
      this.setData({
        hotDishes: [
          { _id: '1', name: '招牌红烧肉', price: 68, emoji: '🥩' },
          { _id: '2', name: '清蒸鲈鱼', price: 88, emoji: '🐟' },
          { _id: '3', name: '宫保鸡丁', price: 38, emoji: '🍗' },
          { _id: '4', name: '麻婆豆腐', price: 28, emoji: '🍛' },
          { _id: '5', name: '糖醋排骨', price: 58, emoji: '🍖' }
        ]
      })
    }
  },

  async loadCategories() {
    try {
      const db = wx.cloud.database()
      const res = await db.collection('categories')
        .where({ status: 1 })
        .orderBy('sort', 'asc')
        .get()
      this.setData({ categories: res.data })
    } catch (err) {
      console.error('加载分类失败', err)
      this.setData({
        categories: [
          { _id: '1', name: '热菜', emoji: '🔥' },
          { _id: '2', name: '凉菜', emoji: '🥗' },
          { _id: '3', name: '主食', emoji: '🍚' },
          { _id: '4', name: '汤品', emoji: '🍲' },
          { _id: '5', name: '饮品', emoji: '🥤' },
          { _id: '6', name: '甜点', emoji: '🍰' }
        ]
      })
    }
  },

  loadBanners() {
    this.setData({
      banners: [
        { _id: '1', title: '新店开业，全场8折', emoji: '🎉' }
      ]
    })
  },

  loadTableNumber() {
    const tableNumber = app.globalData.tableNumber || wx.getStorageSync('tableNumber') || ''
    this.setData({ tableNumber: tableNumber || '未选择' })
  },

  async loadTables() {
    try {
      const db = wx.cloud.database()
      const res = await db.collection('tables')
        .where({ status: 1 })
        .orderBy('tableNumber', 'asc')
        .get()
      this.setData({ tables: res.data })
    } catch (err) {
      console.error('加载桌号失败', err)
      const tables = []
      for (let i = 1; i <= 20; i++) {
        tables.push({ _id: i.toString(), tableNumber: `${i}号桌`, status: 1 })
      }
      this.setData({ tables })
    }
  },

  showTableSelector() {
    this.setData({ showTableSelector: true })
  },

  hideTableSelector() {
    this.setData({ showTableSelector: false })
  },

  selectTable(e) {
    const tableNumber = e.currentTarget.dataset.table
    wx.setStorageSync('tableNumber', tableNumber)
    app.globalData.tableNumber = tableNumber
    this.setData({ 
      tableNumber,
      showTableSelector: false 
    })
    wx.showToast({
      title: `已选择${tableNumber}`,
      icon: 'success'
    })
  },

  openLocation() {
    const address = this.data.shopInfo.address
    wx.openLocation({
      latitude: 0,
      longitude: 0,
      name: this.data.shopInfo.name,
      address: address,
      scale: 18
    })
  },

  makeCall() {
    const phone = this.data.shopInfo.phone
    wx.makePhoneCall({
      phoneNumber: phone,
      success: () => {
        console.log('拨打电话成功')
      },
      fail: (err) => {
        console.error('拨打电话失败', err)
        wx.showToast({
          title: '拨打电话失败',
          icon: 'none'
        })
      }
    })
  },

  goToDetail(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({
      url: `/pages/dishDetail/dishDetail?id=${id}`
    })
  },

  goToCategory(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({
      url: `/pages/category/category?id=${id}`
    })
  }
})