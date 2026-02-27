Page({
  data: {
    orderId: '',
    order: {}
  },

  onLoad(options) {
    this.setData({ orderId: options.id })
    this.loadOrderDetail()
  },

  async loadOrderDetail() {
    wx.showLoading({
      title: '加载中...'
    })

    try {
      const res = await wx.cloud.callFunction({
        name: 'getOrderDetail',
        data: { orderId: this.data.orderId }
      })

      if (!res.result.success) {
        throw new Error(res.result.message)
      }

      const order = {
        ...res.result.data,
        statusText: this.getStatusText(res.result.data.status),
        statusDesc: this.getStatusDesc(res.result.data.status),
        createTimeText: this.formatTime(res.result.data.createTime),
        payTimeText: res.result.data.payTime ? this.formatTime(res.result.data.payTime) : ''
      }

      this.setData({ order })
    } catch (err) {
      console.error('加载订单详情失败', err)
      wx.showToast({
        title: err.message || '加载失败',
        icon: 'none'
      })
    } finally {
      wx.hideLoading()
    }
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

  getStatusDesc(status) {
    const descMap = {
      0: '请尽快完成支付',
      1: '等待商家接单',
      2: '商家正在为您准备美食',
      3: '美食已准备好，请耐心等待',
      4: '订单已完成，感谢您的光临',
      5: '订单已取消'
    }
    return descMap[status] || ''
  },

  formatTime(timestamp) {
    const date = new Date(timestamp)
    const year = date.getFullYear()
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    const day = date.getDate().toString().padStart(2, '0')
    const hour = date.getHours().toString().padStart(2, '0')
    const minute = date.getMinutes().toString().padStart(2, '0')
    const second = date.getSeconds().toString().padStart(2, '0')
    return `${year}-${month}-${day} ${hour}:${minute}:${second}`
  },

  async payOrder() {
    wx.showLoading({
      title: '处理中...'
    })

    try {
      const res = await wx.cloud.callFunction({
        name: 'createPayment',
        data: { orderId: this.data.orderId }
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
            this.loadOrderDetail()
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

  cancelOrder() {
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
              data: { orderId: this.data.orderId }
            })

            wx.hideLoading()
            wx.showToast({
              title: '订单已取消',
              icon: 'success'
            })
            this.loadOrderDetail()
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

  contactService() {
    const app = getApp()
    wx.makePhoneCall({
      phoneNumber: app.globalData.shopInfo.phone
    })
  }
})