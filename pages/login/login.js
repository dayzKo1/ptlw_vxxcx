const app = getApp()

Page({
  data: {
    userInfo: null
  },

  onLoad() {
    this.checkLogin()
  },

  checkLogin() {
    const userInfo = wx.getStorageSync('userInfo')
    if (userInfo) {
      app.globalData.userInfo = userInfo
      wx.switchTab({
        url: '/pages/index/index'
      })
    }
  },

  handleLogin() {
    wx.getUserProfile({
      desc: '用于完善用户资料',
      success: (res) => {
        const userInfo = res.userInfo
        this.login(userInfo)
      },
      fail: (err) => {
        console.error('获取用户信息失败', err)
        wx.showToast({
          title: '需要授权才能使用',
          icon: 'none'
        })
      }
    })
  },

  async login(userInfo) {
    wx.showLoading({
      title: '登录中...',
      mask: true
    })

    try {
      const loginRes = await wx.cloud.callFunction({
        name: 'login',
        data: {
          userInfo: userInfo
        }
      })

      if (loginRes.result.success) {
        const { openid, sessionKey } = loginRes.result.data
        
        const userData = {
          ...userInfo,
          openid: openid,
          loginTime: new Date().getTime()
        }

        wx.setStorageSync('userInfo', userData)
        app.globalData.userInfo = userData

        wx.hideLoading()
        wx.showToast({
          title: '登录成功',
          icon: 'success',
          duration: 1500
        })

        setTimeout(() => {
          wx.switchTab({
            url: '/pages/index/index'
          })
        }, 1500)
      } else {
        wx.hideLoading()
        wx.showToast({
          title: '登录失败',
          icon: 'none'
        })
      }
    } catch (err) {
      console.error('登录失败', err)
      wx.hideLoading()
      wx.showToast({
        title: '登录失败，请重试',
        icon: 'none'
      })
    }
  }
})