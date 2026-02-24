Page({
  data: {
    categoryId: '',
    category: {},
    dishes: [],
    cart: {}
  },

  onLoad(options) {
    this.setData({ categoryId: options.id })
    this.loadCategory()
    this.loadDishes()
    this.loadCart()
  },

  onShow() {
    this.loadCart()
  },

  async loadCategory() {
    try {
      const db = wx.cloud.database()
      const res = await db.collection('categories').doc(this.data.categoryId).get()
      this.setData({ category: res.data })
    } catch (err) {
      console.error('加载分类失败', err)
    }
  },

  async loadDishes() {
    try {
      const db = wx.cloud.database()
      const res = await db.collection('dishes')
        .where({ categoryId: this.data.categoryId, status: 1 })
        .orderBy('sort', 'asc')
        .get()

      const dishes = res.data.map(dish => ({
        ...dish,
        quantity: this.data.cart[dish._id] || 0
      }))

      this.setData({ dishes })
    } catch (err) {
      console.error('加载菜品失败', err)
    }
  },

  loadCart() {
    const cart = wx.getStorageSync('cart') || {}
    this.setData({ cart })
    this.loadDishes()
  },

  plusDish(e) {
    const id = e.currentTarget.dataset.id
    const cart = this.data.cart
    cart[id] = (cart[id] || 0) + 1
    this.updateCart(cart)
  },

  minusDish(e) {
    const id = e.currentTarget.dataset.id
    const cart = this.data.cart
    if (cart[id] > 0) {
      cart[id]--
      if (cart[id] === 0) {
        delete cart[id]
      }
      this.updateCart(cart)
    }
  },

  updateCart(cart) {
    const dishes = this.data.dishes.map(dish => ({
      ...dish,
      quantity: cart[dish._id] || 0
    }))

    this.setData({
      cart,
      dishes
    })

    wx.setStorageSync('cart', cart)
  },

  goToDetail(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({
      url: `/pages/dishDetail/dishDetail?id=${id}`
    })
  }
})