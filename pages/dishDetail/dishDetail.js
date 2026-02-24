Page({
  data: {
    dishId: '',
    dish: {},
    images: [],
    quantity: 1,
    remark: ''
  },

  onLoad(options) {
    this.setData({ dishId: options.id })
    this.loadDishDetail()
  },

  async loadDishDetail() {
    wx.showLoading({
      title: '加载中...'
    })

    try {
      const db = wx.cloud.database()
      const res = await db.collection('dishes').doc(this.data.dishId).get()
      
      const dish = res.data
      const images = dish.images && dish.images.length > 0 ? dish.images : [dish.image]

      this.setData({
        dish,
        images
      })

      wx.setStorageSync(`dish_${this.data.dishId}`, dish)
    } catch (err) {
      console.error('加载菜品详情失败', err)
      wx.showToast({
        title: '加载失败',
        icon: 'none'
      })
    } finally {
      wx.hideLoading()
    }
  },

  plusQuantity() {
    this.setData({
      quantity: this.data.quantity + 1
    })
  },

  minusQuantity() {
    if (this.data.quantity > 1) {
      this.setData({
        quantity: this.data.quantity - 1
      })
    }
  },

  onRemarkInput(e) {
    this.setData({
      remark: e.detail.value
    })
  },

  addToCart() {
    const cart = wx.getStorageSync('cart') || {}
    const dishId = this.data.dishId
    const quantity = this.data.quantity

    cart[dishId] = (cart[dishId] || 0) + quantity
    wx.setStorageSync('cart', cart)

    wx.showToast({
      title: `已添加${quantity}份到购物车`,
      icon: 'success',
      duration: 2000,
      success: () => {
        setTimeout(() => {
          wx.navigateBack()
        }, 2000)
      }
    })
  }
})