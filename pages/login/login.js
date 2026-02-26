const app = getApp()

Page({
  data: {
    userInfo: null,
    isDev: false,
    selectedRole: 'customer'
  },

  onLoad() {
    this.checkLogin()
    this.checkDevMode()
  },

  checkLogin() {
    const userInfo = wx.getStorageSync('userInfo')
    if (userInfo) {
      app.globalData.userInfo = userInfo
      this.navigateByRole(userInfo.role)
    }
  },

  checkDevMode() {
    const isDev = wx.getStorageSync('isDevMode') || false
    this.setData({ isDev })
  },

  selectRole(e) {
    const role = e.currentTarget.dataset.role
    this.setData({ selectedRole: role })
  },

  navigateByRole(role) {
    if (role === 'merchant') {
      wx.redirectTo({
        url: '/pages/merchantOrder/merchantOrder'
      })
    } else {
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

  handleDevLogin() {
    const mockUserInfo = {
      nickName: '开发测试用户',
      avatarUrl: '',
      gender: 1,
      language: 'zh_CN',
      city: '福州',
      province: '福建',
      country: '中国'
    }
    
    this.mockLogin(mockUserInfo)
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
        const { openid, sessionKey, role } = loginRes.result.data
        
        const userData = {
          ...userInfo,
          openid: openid,
          role: role,
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
          this.navigateByRole(role)
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
  },

  async mockLogin(userInfo) {
    wx.showLoading({
      title: '模拟登录中...',
      mask: true
    })

    try {
      const mockOpenid = 'dev_' + Date.now()
      
      const userData = {
        ...userInfo,
        openid: mockOpenid,
        role: this.data.selectedRole,
        loginTime: new Date().getTime(),
        isMock: true
      }

      wx.setStorageSync('userInfo', userData)
      app.globalData.userInfo = userData

      wx.hideLoading()
      wx.showToast({
        title: '模拟登录成功',
        icon: 'success',
        duration: 1500
      })

      setTimeout(() => {
        this.navigateByRole(userData.role)
      }, 1500)
    } catch (err) {
      console.error('模拟登录失败', err)
      wx.hideLoading()
      wx.showToast({
        title: '模拟登录失败',
        icon: 'none'
      })
    }
  },

  toggleDevMode(e) {
    const isDev = e.detail.value
    wx.setStorageSync('isDevMode', isDev)
    this.setData({ isDev })
    wx.showToast({
      title: isDev ? '开发模式已开启' : '开发模式已关闭',
      icon: 'none'
    })
  }
})