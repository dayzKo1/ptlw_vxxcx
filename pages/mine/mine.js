const app = getApp()

Page({
  data: {
    userInfo: null,
    isMerchant: false,
    isDev: false
  },

  onLoad() {
    this.loadUserInfo()
    this.checkDevMode()
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

  checkDevMode() {
    const isDev = wx.getStorageSync('isDevMode') || false
    this.setData({ isDev })
  },

  toggleDevMode(e) {
    const isDev = e.detail ? e.detail.value : !this.data.isDev
    wx.setStorageSync('isDevMode', isDev)
    this.setData({ isDev })
    wx.showToast({
      title: isDev ? '开发模式已开启' : '开发模式已关闭',
      icon: 'none'
    })
  },

  toggleDevModeHint() {
    let count = this.data.clickCount || 0
    count++
    this.setData({ clickCount: count })
    
    if (count >= 5) {
      this.toggleDevMode()
      this.setData({ clickCount: 0 })
    }
  },

  async handleAddMerchant() {
    wx.showLoading({ title: '处理中...' })
    try {
      const res = await wx.cloud.callFunction({
        name: 'addMerchantWhitelist',
        data: {
          nickname: this.data.userInfo.nickName
        }
      })
      wx.hideLoading()
      
      if (res.result.success) {
        wx.showModal({
          title: '成功',
          content: res.result.message + '\n\nOpenID: ' + res.result.openid + '\n\n请重新登录生效',
          showCancel: false
        })
      } else {
        wx.showToast({
          title: res.result.message || '操作失败',
          icon: 'none'
        })
      }
    } catch (err) {
      wx.hideLoading()
      console.error('添加商户失败', err)
      wx.showToast({
        title: '操作失败',
        icon: 'none'
      })
    }
  },

  handleMerchantOrder() {
    wx.navigateTo({
      url: '/pages/merchantOrder/merchantOrder'
    })
  },

  handleMerchantDish() {
    wx.navigateTo({
      url: '/pages/merchantDish/merchantDish'
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