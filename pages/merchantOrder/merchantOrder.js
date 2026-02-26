const app = getApp()

Page({
  data: {
    currentTab: 0,
    orders: [],
    page: 1,
    pageSize: 20,
    hasMore: true,
    loading: false,
    statusTabs: [
      { status: -1, name: '全部' },
      { status: 0, name: '待支付' },
      { status: 1, name: '制作中' },
      { status: 2, name: '已出餐' },
      { status: 3, name: '已完成' },
      { status: 4, name: '已取消' }
    ]
  },

  onLoad() {
    this.checkMerchantRole()
  },

  onShow() {
    this.loadOrders()
  },

  checkMerchantRole() {
    const userInfo = wx.getStorageSync('userInfo')
    if (!userInfo) {
      wx.redirectTo({
        url: '/pages/login/login'
      })
      return
    }
    if (userInfo.role !== 'merchant') {
      wx.showModal({
        title: '提示',
        content: '此页面仅限商户访问',
        showCancel: false,
        success: () => {
          wx.switchTab({
            url: '/pages/index/index'
          })
        }
      })
    }
  },

  switchTab(e) {
    const tab = parseInt(e.currentTarget.dataset.tab)
    this.setData({
      currentTab: tab,
      page: 1,
      hasMore: true,
      orders: []
    })
    this.loadOrders()
  },

  async loadOrders() {
    if (!this.data.hasMore || this.data.loading) return

    this.setData({ loading: true })
    wx.showLoading({ title: '加载中...' })

    try {
      const db = wx.cloud.database()
      const _ = db.command

      let statusCondition = {}
      if (this.data.currentTab >= 0) {
        statusCondition = { status: this.data.currentTab }
      }

      const res = await db.collection('orders')
        .where(statusCondition)
        .orderBy('createTime', 'desc')
        .skip((this.data.page - 1) * this.data.pageSize)
        .limit(this.data.pageSize)
        .get()

      const orders = res.data.map(order => ({
        ...order,
        orderNo: order.orderNo || order._id.slice(-8),
        statusText: this.getStatusText(order.status),
        timeText: this.formatTime(order.createTime),
        itemCount: order.items ? order.items.reduce((sum, item) => sum + item.quantity, 0) : 0
      }))

      this.setData({
        orders: this.data.page === 1 ? orders : [...this.data.orders, ...orders],
        hasMore: orders.length === this.data.pageSize,
        page: this.data.page + 1,
        loading: false
      })
    } catch (err) {
      console.error('加载订单失败', err)
      this.setData({ loading: false })
      wx.showToast({
        title: '加载失败',
        icon: 'none'
      })
    } finally {
      wx.hideLoading()
    }
  },

  loadMore() {
    this.loadOrders()
  },

  getStatusText(status) {
    const statusMap = {
      0: '待支付',
      1: '制作中',
      2: '已出餐',
      3: '已完成',
      4: '已取消'
    }
    return statusMap[status] || '未知'
  },

  getStatusClass(status) {
    const classMap = {
      0: 'status-pending',
      1: 'status-cooking',
      2: 'status-ready',
      3: 'status-completed',
      4: 'status-cancelled'
    }
    return classMap[status] || ''
  },

  formatTime(timestamp) {
    const date = new Date(timestamp)
    const month = date.getMonth() + 1
    const day = date.getDate()
    const hour = date.getHours().toString().padStart(2, '0')
    const minute = date.getMinutes().toString().padStart(2, '0')
    return `${month}月${day}日 ${hour}:${minute}`
  },

  goToDetail(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({
      url: `/pages/orderDetail/orderDetail?id=${id}`
    })
  },

  async updateStatus(e) {
    const { id, status } = e.currentTarget.dataset
    const statusNames = ['待支付', '制作中', '已出餐', '已完成', '已取消']
    
    wx.showModal({
      title: '确认操作',
      content: `确定将订单状态改为"${statusNames[status]}"吗？`,
      success: async (res) => {
        if (res.confirm) {
          wx.showLoading({ title: '处理中...' })
          try {
            await wx.cloud.callFunction({
              name: 'updateOrderStatus',
              data: { orderId: id, status: status }
            })
            wx.hideLoading()
            wx.showToast({
              title: '状态已更新',
              icon: 'success'
            })
            this.setData({
              page: 1,
              hasMore: true,
              orders: []
            })
            this.loadOrders()
          } catch (err) {
            wx.hideLoading()
            console.error('更新状态失败', err)
            wx.showToast({
              title: '更新失败',
              icon: 'none'
            })
          }
        }
      }
    })
  },

  async cancelOrder(e) {
    const id = e.currentTarget.dataset.id
    wx.showModal({
      title: '提示',
      content: '确定要取消这个订单吗？',
      success: async (res) => {
        if (res.confirm) {
          wx.showLoading({ title: '处理中...' })
          try {
            await wx.cloud.callFunction({
              name: 'cancelOrder',
              data: { orderId: id }
            })
            wx.hideLoading()
            wx.showToast({
              title: '订单已取消',
              icon: 'success'
            })
            this.setData({
              page: 1,
              hasMore: true,
              orders: []
            })
            this.loadOrders()
          } catch (err) {
            wx.hideLoading()
            console.error('取消订单失败', err)
            wx.showToast({
              title: '取消失败',
              icon: 'none'
            })
          }
        }
      }
    })
  },

  goToCustomerMode() {
    wx.switchTab({
      url: '/pages/index/index'
    })
  },

  onPullDownRefresh() {
    this.setData({
      page: 1,
      hasMore: true,
      orders: []
    })
    this.loadOrders()
    wx.stopPullDownRefresh()
  },

  onReachBottom() {
    this.loadMore()
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
            wx.redirectTo({
              url: '/pages/login/login'
            })
          }, 1500)
        }
      }
    })
  }
})