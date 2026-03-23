const app = getApp()

Page({
  data: {
    avatarUrl: '',
    nickname: '',
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
        url: '/packageMerchant/merchantHome/merchantHome'
      })
    } else {
      wx.switchTab({
        url: '/pages/index/index'
      })
    }
  },

  // 新版头像选择
  onChooseAvatar(e) {
    const { avatarUrl } = e.detail
    this.setData({ avatarUrl })
  },

  // 昵称输入
  onNicknameInput(e) {
    this.setData({ nickname: e.detail.value })
  },

  onNicknameBlur(e) {
    this.setData({ nickname: e.detail.value })
  },

  // 新版登录
  async handleLogin() {
    const { avatarUrl, nickname } = this.data

    if (!nickname || !nickname.trim()) {
      wx.showToast({
        title: '请输入昵称',
        icon: 'none'
      })
      return
    }

    const userInfo = {
      nickName: nickname.trim(),
      avatarUrl: avatarUrl || '',
      gender: 0,
      language: 'zh_CN',
      city: '',
      province: '',
      country: '中国'
    }

    await this.login(userInfo)
  },

  async login(userInfo) {
    wx.showLoading({
      title: '登录中...',
      mask: true
    })

    try {
      const loginRes = await wx.cloud.callFunction({
        name: 'user',
        data: {
          action: 'login',
          userInfo: userInfo
        }
      })

      console.log('登录云函数返回:', loginRes)

      wx.hideLoading()

      if (loginRes.result && loginRes.result.success) {
        const { openid, role } = loginRes.result.data

        const userData = {
          ...userInfo,
          openid: openid,
          role: role,
          loginTime: new Date().getTime()
        }

        wx.setStorageSync('userInfo', userData)
        app.globalData.userInfo = userData

        wx.showToast({
          title: '登录成功',
          icon: 'success',
          duration: 1500
        })

        setTimeout(() => {
          this.navigateByRole(role)
        }, 1500)
      } else {
        // 显示详细错误信息
        const errorMsg = loginRes.result?.error || loginRes.result?.message || '登录失败'
        console.error('登录失败:', errorMsg, loginRes.result)

        wx.showModal({
          title: '登录失败',
          content: errorMsg,
          showCancel: false
        })
      }
    } catch (err) {
      wx.hideLoading()
      console.error('登录异常', err)

      let errorMsg = '登录失败，请重试'
      if (err.errMsg) {
        if (err.errMsg.includes('timeout')) {
          errorMsg = '网络超时，请检查网络后重试'
        } else if (err.errMsg.includes('not deployed')) {
          errorMsg = '云函数未部署，请先上传 login 云函数'
        } else if (err.errMsg.includes('env')) {
          errorMsg = '云开发环境未配置，请检查 cloudbaserc.json'
        }
      }

      wx.showModal({
        title: '登录异常',
        content: errorMsg,
        showCancel: false
      })
    }
  },

  // 开发模式登录
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