Page({
  data: {
    dishId: '',
    dish: {},
    images: [],
    quantity: 1,
    remark: '',
    totalPrice: '0.00'
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
        images,
        totalPrice: (dish.price * this.data.quantity).toFixed(2)
      })

      wx.setStorageSync(`dish_${this.data.dishId}`, dish)
    } catch (err) {
      console.error('加载菜品详情失败', err)
      const mockDish = {
        _id: this.data.dishId || '1',
        name: '招牌红烧肉',
        price: 68,
        description: '精选五花肉，慢火红烧，口感软糯，肥而不腻',
        ingredients: '五花肉、冰糖、生抽、老抽、料酒',
        isHot: true,
        isNew: false,
        spicyLevel: 2,
        image: ''
      }
      this.setData({
        dish: mockDish,
        images: ['🥩'],
        totalPrice: (mockDish.price * this.data.quantity).toFixed(2)
      })
    } finally {
      wx.hideLoading()
    }
  },

  plusQuantity() {
    const newQuantity = this.data.quantity + 1
    this.setData({
      quantity: newQuantity,
      totalPrice: (this.data.dish.price * newQuantity).toFixed(2)
    })
  },

  minusQuantity() {
    if (this.data.quantity > 1) {
      const newQuantity = this.data.quantity - 1
      this.setData({
        quantity: newQuantity,
        totalPrice: (this.data.dish.price * newQuantity).toFixed(2)
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