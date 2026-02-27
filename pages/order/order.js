Page({
  data: {
    currentTab: 0,
    orders: [],
    page: 1,
    pageSize: 10,
    hasMore: true
  },

  onLoad() {
    this.loadOrders()
  },

  onShow() {
    this.loadOrders()
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
    if (!this.data.hasMore) return

    wx.showLoading({
      title: '加载中...'
    })

    try {
      let statusCondition
      switch (this.data.currentTab) {
        case 0:
          statusCondition = 0
          break
        case 1:
          statusCondition = [1, 2]
          break
        case 2:
          statusCondition = 3
          break
      }

      const res = await wx.cloud.callFunction({
        name: 'getUserOrders',
        data: {
          status: statusCondition,
          page: this.data.page,
          pageSize: this.data.pageSize
        }
      })

      if (!res.result.success) {
        throw new Error(res.result.message)
      }

      const orders = res.result.data.orders.map(order => ({
        ...order,
        statusText: this.getStatusText(order.status),
        timeText: this.formatTime(order.createTime),
        itemCount: order.items ? order.items.reduce((sum, item) => sum + item.quantity, 0) : 0
      }))

      this.setData({
        orders: this.data.page === 1 ? orders : [...this.data.orders, ...orders],
        hasMore: res.result.data.hasMore,
        page: this.data.page + 1
      })
    } catch (err) {
      console.error('加载订单失败', err)
      wx.showToast({
        title: '加载失败',
        icon: 'none'
      })
      this.setData({ hasMore: false })
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
      1: '待接单',
      2: '制作中',
      3: '已出餐',
      4: '已完成',
      5: '已取消'
    }
    return statusMap[status] || '未知'
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
      url: `/packageOrder/orderDetail/orderDetail?id=${id}`
    })
  },

  async payOrder(e) {
    const id = e.currentTarget.dataset.id
    wx.showLoading({
      title: '处理中...'
    })

    try {
      const res = await wx.cloud.callFunction({
        name: 'createPayment',
        data: { orderId: id }
      })

      wx.hideLoading()

      if (res.result.success) {
        const payment = res.result.payment
        wx.requestPayment({
          ...payment,
          success: () => {
            wx.showToast({
              title: '支付成功',
              icon: 'success'
            })
            this.loadOrders()
          },
          fail: (err) => {
            if (err.errMsg !== 'requestPayment:fail cancel') {
              wx.showToast({
                title: '支付失败',
                icon: 'none'
              })
            }
          }
        })
      } else {
        wx.showToast({
          title: res.result.message || '支付失败',
          icon: 'none'
        })
      }
    } catch (err) {
      wx.hideLoading()
      console.error('支付失败', err)
      wx.showToast({
        title: '支付失败，请重试',
        icon: 'none'
      })
    }
  },

  cancelOrder(e) {
    const id = e.currentTarget.dataset.id
    wx.showModal({
      title: '提示',
      content: '确定要取消这个订单吗？',
      success: async (res) => {
        if (res.confirm) {
          wx.showLoading({
            title: '处理中...'
          })

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
            this.loadOrders()
          } catch (err) {
            wx.hideLoading()
            console.error('取消订单失败', err)
            wx.showToast({
              title: '取消失败，请重试',
              icon: 'none'
            })
          }
        }
      }
    })
  },

  reorder(e) {
    const id = e.currentTarget.dataset.id
    wx.showModal({
      title: '提示',
      content: '确定要再来一单吗？',
      success: async (res) => {
        if (res.confirm) {
          try {
            const orderRes = await wx.cloud.callFunction({
              name: 'getOrderDetail',
              data: { orderId: id }
            })

            if (!orderRes.result.success) {
              throw new Error(orderRes.result.message)
            }

            const order = orderRes.result.data

            const cart = wx.getStorageSync('cart') || {}
            order.items.forEach(item => {
              cart[item.dishId] = (cart[item.dishId] || 0) + item.quantity
            })
            wx.setStorageSync('cart', cart)

            wx.showToast({
              title: '已加入购物车',
              icon: 'success'
            })

            setTimeout(() => {
              wx.switchTab({
                url: '/pages/menu/menu'
              })
            }, 1500)
          } catch (err) {
            console.error('再来一单失败', err)
            wx.showToast({
              title: '操作失败，请重试',
              icon: 'none'
            })
          }
        }
      }
    })
  }
})