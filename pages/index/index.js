const app = getApp()

Page({
  data: {
    shopInfo: {},
    banners: [],
    tableNumber: ''
  },

  onLoad() {
    this.setData({
      shopInfo: app.globalData.shopInfo
    })
    this.loadBanners()
    this.loadTableNumber()
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
    this.setData({ tableNumber })
  },

  goToMenu(e) {
    const mode = e.currentTarget.dataset.mode
    wx.switchTab({
      url: '/pages/menu/menu'
    })
    
    setTimeout(() => {
      const pages = getCurrentPages()
      const menuPage = pages.find(page => page.route === 'pages/menu/menu')
      if (menuPage) {
        if (mode === 'dine-in') {
          menuPage.setData({ deliveryMode: 'pickup' })
        } else if (mode === 'delivery') {
          menuPage.setData({ deliveryMode: 'delivery' })
        }
      }
    }, 100)
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
  }
})