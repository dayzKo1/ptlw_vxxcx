App({
  onLaunch() {
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力')
    } else {
      wx.cloud.init({
        traceUser: true,
      })
    }
    
    this.checkLogin()
  },
  
  checkLogin() {
    const userInfo = wx.getStorageSync('userInfo')
    if (userInfo) {
      this.globalData.userInfo = userInfo
    }
  },
  
  globalData: {
    userInfo: null,
    shopInfo: {
      name: '平潭礼物',
      address: '福建省福州市平潭县君山镇北港村新门前16号',
      phone: '181-5919-5897',
      businessHours: '10:00-22:00',
      logo: ''
    }
  }
})