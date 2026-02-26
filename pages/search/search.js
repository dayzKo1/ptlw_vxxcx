const app = getApp()

Page({
  data: {
    searchKeyword: '',
    searchResults: [],
    cart: {},
    cartCount: 0,
    cartTotal: 0,
    cartItems: [],
    showCartDrawer: false,
    showDishModal: false,
    selectedDish: null
  },

  onLoad(options) {
    if (options.keyword) {
      this.setData({
        searchKeyword: options.keyword
      })
      this.searchDishes(options.keyword)
    }
    this.loadCart()
  },

  async searchDishes(keyword) {
    if (!keyword || !keyword.trim()) {
      this.setData({
        searchResults: []
      })
      return
    }

    try {
      const db = wx.cloud.database()
      const res = await db.collection('dishes')
        .where({
          status: 1,
          name: db.RegExp({
            regexp: keyword,
            options: 'i'
          })
        })
        .orderBy('sort', 'asc')
        .limit(50)
        .get()

      const searchResults = res.data.map(dish => ({
        ...dish,
        quantity: this.data.cart[dish._id] || 0
      }))

      this.setData({
        searchResults
      })
    } catch (err) {
      console.error('搜索失败', err)
      this.setData({
        searchResults: []
      })
    }
  },

  onSearchInput(e) {
    const keyword = e.detail.value.trim()
    this.setData({ searchKeyword: keyword })
    
    if (keyword) {
      this.searchDishes(keyword)
    } else {
      this.setData({
        searchResults: []
      })
    }
  },

  clearSearch() {
    this.setData({
      searchKeyword: '',
      searchResults: []
    })
  },

  loadCart() {
    const cart = wx.getStorageSync('cart') || {}
    this.updateCart(cart)
  },

  updateCart(cart) {
    let count = 0
    let total = 0
    const cartItems = []

    const searchResults = this.data.searchResults
    searchResults.forEach(dish => {
      const quantity = cart[dish._id] || 0
      count += quantity
      total += quantity * dish.price
      if (quantity > 0) {
        cartItems.push({
          ...dish,
          quantity
        })
      }
    })

    this.setData({
      cart,
      cartCount: count,
      cartTotal: total.toFixed(2),
      cartItems
    })

    wx.setStorageSync('cart', cart)
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

  stopPropagation() {
    return false
  },

  toggleCartDrawer() {
    this.setData({
      showCartDrawer: !this.data.showCartDrawer
    })
  },

  goToDetail(e) {
    const id = e.currentTarget.dataset.id
    const selectedDish = this.data.searchResults.find(d => d._id === id)
    
    if (selectedDish) {
      this.setData({
        selectedDish,
        showDishModal: true
      })
    }
  },

  closeDishModal() {
    this.setData({
      showDishModal: false,
      selectedDish: null
    })
  },

  addToCartFromModal() {
    const selectedDish = this.data.selectedDish
    if (!selectedDish) return

    const id = selectedDish._id
    const cart = this.data.cart
    cart[id] = (cart[id] || 0) + 1
    this.updateCart(cart)
    
    this.closeDishModal()
  },

  goToCheckout() {
    this.setData({
      showCartDrawer: false
    })
    wx.navigateBack()
  }
})