Page({
  data: {
    version: '1.0.0'
  },

  onLoad() {
    const accountInfo = wx.getAccountInfoSync()
    if (accountInfo && accountInfo.miniProgram) {
      this.setData({
        version: accountInfo.miniProgram.version || '1.0.0'
      })
    }
  }
})
