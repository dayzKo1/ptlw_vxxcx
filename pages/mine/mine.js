const app = getApp()

Page({
  data: {
    userInfo: null,
    isMerchant: false
  },

  onLoad() {
    this.loadUserInfo()
  },

  onShow() {
    this.loadUserInfo()
  },

  loadUserInfo() {
    const userInfo = wx.getStorageSync('userInfo')
    if (userInfo) {
      this.setData({ 
        userInfo,
        isMerchant: userInfo.role === 'merchant'
      })
    } else {
      wx.navigateTo({
        url: '/pages/login/login'
      })
    }
  },

  handleMerchantOrder() {
    wx.navigateTo({
      url: '/pages/merchantOrder/merchantOrder'
    })
  },

  handleAddress() {
    wx.navigateTo({
      url: '/pages/addressList/addressList'
    })
  },

  handleTableQRCode() {
    wx.navigateTo({
      url: '/pages/tableQRCode/tableQRCode'
    })
  },

  handleSettings() {
    wx.navigateTo({
      url: '/pages/settings/settings'
    })
  },

  handleAbout() {
    wx.navigateTo({
      url: '/pages/about/about'
    })
  },

  handleLogout() {
    wx.showModal({
      title: '提示',
      content: '确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          wx.removeStorageSync('userInfo')
          app.globalData.userInfo = null
          wx.showToast({
            title: '已退出登录',
            icon: 'success'
          })
          setTimeout(() => {
            wx.navigateTo({
              url: '/pages/login/login'
            })
          }, 1500)
        }
      }
    })
  }
})