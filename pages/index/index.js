const app = getApp()

Page({
  data: {
    shopInfo: {},
    hotDishes: [],
    categories: [],
    tableNumber: ''
  },

  onLoad() {
    this.setData({
      shopInfo: app.globalData.shopInfo
    })
    this.loadHotDishes()
    this.loadCategories()
    this.loadTableNumber()
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
    }
  },

  loadTableNumber() {
    const tableNumber = wx.getStorageSync('tableNumber')
    if (tableNumber) {
      this.setData({ tableNumber })
    }
  },

  scanCode() {
    wx.scanCode({
      success: (res) => {
        const tableNumber = res.result
        wx.setStorageSync('tableNumber', tableNumber)
        this.setData({ tableNumber })
        wx.showToast({
          title: `已选择${tableNumber}号桌`,
          icon: 'success'
        })
      },
      fail: () => {
        wx.showToast({
          title: '扫码失败',
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
  },

  goToPage(e) {
    const page = e.currentTarget.dataset.page
    wx.navigateTo({
      url: `/pages/${page}/${page}`
    })
  }
})