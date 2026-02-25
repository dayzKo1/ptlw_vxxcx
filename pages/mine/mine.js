const app = getApp()

Page({
  data: {
    userInfo: null,
    activeTab: 'all',
    orders: []
  },

  onLoad() {
    this.loadUserInfo()
    this.loadOrders()
  },

  onShow() {
    this.loadOrders()
  },

  loadUserInfo() {
    const userInfo = wx.getStorageSync('userInfo')
    if (userInfo) {
      this.setData({ userInfo })
    } else {
      wx.navigateTo({
        url: '/pages/login/login'
      })
    }
  },

  async loadOrders() {
    try {
      const db = wx.cloud.database()
      const userInfo = wx.getStorageSync('userInfo')
      
      if (!userInfo || !userInfo.openid) {
        return
      }

      let query = db.collection('orders').where({
        openid: userInfo.openid
      }).orderBy('createTime', 'desc').limit(10)

      if (this.data.activeTab !== 'all') {
        query = query.where({
          status: this.data.activeTab
        })
      }

      const res = await query.get()
      
      const orders = res.data.map(order => {
        let statusText = ''
        switch (order.status) {
          case 'pending':
            statusText = '待支付'
            break
          case 'paid':
            statusText = '制作中'
            break
          case 'completed':
            statusText = '已完成'
            break
          case 'cancelled':
            statusText = '已取消'
            break
          default:
            statusText = '未知'
        }

        return {
          ...order,
          statusText: statusText,
          createTime: this.formatTime(order.createTime)
        }
      })

      this.setData({ orders })
    } catch (err) {
      console.error('加载订单失败', err)
    }
  },

  formatTime(timestamp) {
    const date = new Date(timestamp)
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const hour = String(date.getHours()).padStart(2, '0')
    const minute = String(date.getMinutes()).padStart(2, '0')
    return `${year}-${month}-${day} ${hour}:${minute}`
  },

  switchTab(e) {
    const tab = e.currentTarget.dataset.tab
    this.setData({ activeTab: tab })
    this.loadOrders()
  },

  viewAllOrders() {
    wx.navigateTo({
      url: '/pages/order/order'
    })
  },

  viewOrderDetail(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({
      url: `/pages/orderDetail/orderDetail?id=${id}`
    })
  },

  handleAddress() {
    wx.showToast({
      title: '功能开发中',
      icon: 'none'
    })
  },

  handleFavorite() {
    wx.showToast({
      title: '功能开发中',
      icon: 'none'
    })
  },

  handleCoupon() {
    wx.showToast({
      title: '功能开发中',
      icon: 'none'
    })
  },

  handleSettings() {
    wx.showToast({
      title: '功能开发中',
      icon: 'none'
    })
  },

  handleAbout() {
    wx.showToast({
      title: '功能开发中',
      icon: 'none'
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