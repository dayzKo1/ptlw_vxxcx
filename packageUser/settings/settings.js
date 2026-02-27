Page({
  data: {
    cacheSize: '0KB'
  },

  onLoad() {
    this.calculateCacheSize()
  },

  calculateCacheSize() {
    try {
      const res = wx.getStorageInfoSync()
      const size = res.currentSize
      this.setData({
        cacheSize: size < 1024 ? `${size}KB` : `${(size / 1024).toFixed(2)}MB`
      })
    } catch (err) {
      console.error('获取缓存大小失败', err)
    }
  },

  clearCache() {
    wx.showModal({
      title: '提示',
      content: '确定要清除缓存吗？',
      success: (res) => {
        if (res.confirm) {
          wx.showLoading({
            title: '清除中...'
          })

          setTimeout(() => {
            try {
              wx.clearStorageSync()
              this.setData({ cacheSize: '0KB' })
              wx.hideLoading()
              wx.showToast({
                title: '清除成功',
                icon: 'success'
              })
            } catch (err) {
              wx.hideLoading()
              console.error('清除缓存失败', err)
              wx.showToast({
                title: '清除失败',
                icon: 'none'
              })
            }
          }, 500)
        }
      }
    })
  },

  checkUpdate() {
    if (wx.canIUse('getUpdateManager')) {
      const updateManager = wx.getUpdateManager()

      updateManager.onCheckForUpdate((res) => {
        if (res.hasUpdate) {
          updateManager.onUpdateReady(() => {
            wx.showModal({
              title: '更新提示',
              content: '新版本已经准备好，是否重启应用？',
              success: (res) => {
                if (res.confirm) {
                  updateManager.applyUpdate()
                }
              }
            })
          })

          updateManager.onUpdateFailed(() => {
            wx.showModal({
              title: '更新失败',
              content: '新版本下载失败，请检查网络后重试',
              showCancel: false
            })
          })
        } else {
          wx.showToast({
            title: '已是最新版本',
            icon: 'none'
          })
        }
      })
    } else {
      wx.showToast({
        title: '当前微信版本过低',
        icon: 'none'
      })
    }
  },

  goToAbout() {
    wx.navigateTo({
      url: '/packageUser/about/about'
    })
  },

  contactService() {
    wx.makePhoneCall({
      phoneNumber: '13800000000'
    })
  },

  shareApp() {
    wx.showShareMenu({
      withShareTicket: true
    })
  },

  handleLogout() {
    wx.showModal({
      title: '提示',
      content: '确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          wx.removeStorageSync('userInfo')
          wx.removeStorageSync('cart')
          wx.showToast({
            title: '已退出登录',
            icon: 'success'
          })
          setTimeout(() => {
            wx.reLaunch({
              url: '/pages/login/login'
            })
          }, 1500)
        }
      }
    })
  }
})
