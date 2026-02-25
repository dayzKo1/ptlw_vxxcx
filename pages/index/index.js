const app = getApp()

Page({
  data: {
    shopInfo: {},
    hotDishes: [],
    categories: [],
    tableNumber: '',
    banners: []
  },

  onLoad() {
    this.setData({
      shopInfo: app.globalData.shopInfo
    })
    this.loadHotDishes()
    this.loadCategories()
    this.loadTableNumber()
    this.loadBanners()
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
        { _id: '1', title: '新店开业，全场8折', emoji: '🎉' },
        { _id: '2', title: '满100减20', emoji: '🎁' },
        { _id: '3', title: '会员专享优惠', emoji: '💎' }
      ]
    })
  },

  loadTableNumber() {
    const tableNumber = wx.getStorageSync('tableNumber')
    if (tableNumber) {
      this.setData({ tableNumber })
    }
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
  }
})