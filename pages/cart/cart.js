Page({
  data: {
    cartItems: [],
    tableNumber: '',
    deliveryMode: 'pickup',
    remark: '',
    totalPrice: 0
  },

  onLoad() {
    this.loadCart()
    this.loadTableNumber()
  },

  onShow() {
    this.loadCart()
  },

  loadCart() {
    const cart = wx.getStorageSync('cart') || {}
    const cartItems = []
    let totalPrice = 0

    const mockDishes = {
      '1': { _id: '1', name: '招牌红烧肉', price: 68, emoji: '🥩' },
      '2': { _id: '2', name: '宫保鸡丁', price: 38, emoji: '🍗' },
      '3': { _id: '3', name: '清蒸鲈鱼', price: 88, emoji: '🐟' }
    }

    Object.keys(cart).forEach(dishId => {
      const quantity = cart[dishId]
      if (quantity > 0) {
        const dish = wx.getStorageSync(`dish_${dishId}`) || mockDishes[dishId]
        if (dish) {
          cartItems.push({
            ...dish,
            quantity
          })
          totalPrice += quantity * dish.price
        }
      }
    })

    this.setData({
      cartItems,
      totalPrice: totalPrice.toFixed(2)
    })
  },

  loadTableNumber() {
    let tableNumber = wx.getStorageSync('tableNumber')
    if (!tableNumber) {
      tableNumber = '未选择'
    }
    this.setData({ tableNumber })
  },

  plusDish(e) {
    const id = e.currentTarget.dataset.id
    const cart = wx.getStorageSync('cart') || {}
    cart[id] = (cart[id] || 0) + 1
    wx.setStorageSync('cart', cart)
    this.loadCart()
  },

  minusDish(e) {
    const id = e.currentTarget.dataset.id
    const cart = wx.getStorageSync('cart') || {}
    if (cart[id] > 0) {
      cart[id]--
      if (cart[id] === 0) {
        delete cart[id]
      }
      wx.setStorageSync('cart', cart)
      this.loadCart()
    }
  },

  clearCart() {
    wx.showModal({
      title: '提示',
      content: '确定要清空购物车吗？',
      success: (res) => {
        if (res.confirm) {
          wx.removeStorageSync('cart')
          this.loadCart()
        }
      }
    })
  },

  onRemarkInput(e) {
    this.setData({
      remark: e.detail.value
    })
  },

  loadTableNumber() {
    const tableNumber = wx.getStorageSync('tableNumber') || ''
    this.setData({ tableNumber })
  },

  switchDeliveryMode(e) {
    const mode = e.currentTarget.dataset.mode
    this.setData({ deliveryMode: mode })
  },

  async submitOrder() {
    if (this.data.cartItems.length === 0) {
      wx.showToast({
        title: '购物车为空',
        icon: 'none'
      })
      return
    }

    wx.showLoading({
      title: '提交中...'
    })

    try {
      const orderData = {
        tableNumber: this.data.tableNumber || '0',
        items: this.data.cartItems.map(item => ({
          dishId: item._id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          image: item.image
        })),
        totalPrice: parseFloat(this.data.totalPrice),
        remark: this.data.remark,
        deliveryMode: this.data.deliveryMode,
        status: 0,
        createTime: new Date().getTime()
      }

      const res = await wx.cloud.callFunction({
        name: 'createOrder',
        data: orderData
      })

      wx.hideLoading()

      if (res.result.success) {
        wx.removeStorageSync('cart')
        wx.showToast({
          title: '订单提交成功',
          icon: 'success',
          duration: 2000,
          success: () => {
            setTimeout(() => {
              wx.switchTab({
                url: '/pages/order/order'
              })
            }, 2000)
          }
        })
      } else {
        wx.showToast({
          title: res.result.message || '提交失败',
          icon: 'none'
        })
      }
    } catch (err) {
      wx.hideLoading()
      console.error('提交订单失败', err)
      wx.showToast({
        title: '提交失败，请重试',
        icon: 'none'
      })
    }
  },

  goToMenu() {
    wx.switchTab({
      url: '/pages/menu/menu'
    })
  }
})