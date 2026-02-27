const app = getApp()

Page({
  data: {
    categories: [],
    categoryDishes: [],
    currentCategoryId: '',
    cart: {},
    cartCount: 0,
    cartTotal: 0,
    cartItems: [],
    deliveryMode: 'pickup',
    showCartDrawer: false,
    showDishModal: false,
    selectedDish: null,
    shopInfo: {},
    distance: ''
  },

  onLoad() {
    this.loadShopInfo()
    this.loadCategories()
    this.loadCart()
    this.getLocation()
  },

  loadShopInfo() {
    const shopInfo = app.globalData.shopInfo || { name: '美味餐厅' }
    this.setData({ shopInfo })
  },

  getLocation() {
    wx.getLocation({
      type: 'gcj02',
      success: (res) => {
        const { latitude, longitude } = res
        const distance = this.calculateDistance(
          latitude,
          longitude,
          this.data.shopInfo.latitude || 0,
          this.data.shopInfo.longitude || 0
        )
        this.setData({ distance })
      },
      fail: (err) => {
        console.error('获取位置失败', err)
      }
    })
  },

  calculateDistance(lat1, lon1, lat2, lon2) {
    if (!lat2 || !lon2) {
      return ''
    }

    const R = 6371
    const dLat = this.toRad(lat2 - lat1)
    const dLon = this.toRad(lon2 - lon1)
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    const distance = R * c

    if (distance < 1) {
      return Math.round(distance * 1000) + 'm'
    } else {
      return distance.toFixed(1) + 'km'
    }
  },

  toRad(deg) {
    return deg * (Math.PI / 180)
  },

  openLocation() {
    wx.openLocation({
      latitude: this.data.shopInfo.latitude || 0,
      longitude: this.data.shopInfo.longitude || 0,
      name: this.data.shopInfo.name || '美味餐厅',
      address: this.data.shopInfo.address || '',
      scale: 18
    })
  },

  onShow() {
    this.loadCart()
  },

  async loadCategories() {
    try {
      const db = wx.cloud.database()
      const res = await db.collection('categories')
        .where({ status: 1 })
        .orderBy('sort', 'asc')
        .get()
      
      if (res.data.length === 0) {
        wx.showToast({
          title: '暂无菜品分类',
          icon: 'none'
        })
        return
      }
      
      this.setData({ 
        categories: res.data,
        currentCategoryId: res.data[0]._id
      })
      
      this.loadAllDishes()
    } catch (err) {
      console.error('加载分类失败', err)
      wx.showToast({
        title: '加载失败，请重试',
        icon: 'none'
      })
    }
  },

  async loadAllDishes() {
    try {
      const db = wx.cloud.database()
      const categoryDishes = await Promise.all(
        this.data.categories.map(async (category) => {
          let query = db.collection('dishes')
            .where({ categoryId: category._id, status: 1 })
            .orderBy('sort', 'asc')
          
          if (this.data.searchKeyword) {
            query = query.where({
              name: db.RegExp({
                regexp: this.data.searchKeyword,
                options: 'i'
              })
            })
          }
          
          const res = await query.get()
          return {
            ...category,
            dishes: res.data.map(dish => ({
              ...dish,
              quantity: this.data.cart[dish._id] || 0
            }))
          }
        })
      )
      this.setData({ categoryDishes })
    } catch (err) {
      console.error('加载菜品失败', err)
    }
  },

  switchDeliveryMode(e) {
    const mode = e.currentTarget.dataset.mode
    this.setData({ deliveryMode: mode })
  },

  selectCategory(e) {
    const id = e.currentTarget.dataset.id
    this.setData({ currentCategoryId: id })
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
    let count = 0
    let total = 0
    const cartItems = []
    
    const categoryDishes = this.data.categoryDishes.map(category => ({
      ...category,
      dishes: category.dishes.map(dish => {
        const quantity = cart[dish._id] || 0
        count += quantity
        total += quantity * dish.price
        if (quantity > 0) {
          cartItems.push({
            ...dish,
            quantity
          })
        }
        return {
          ...dish,
          quantity
        }
      })
    }))

    this.setData({
      cart,
      cartCount: count,
      cartTotal: total.toFixed(2),
      categoryDishes,
      cartItems
    })

    wx.setStorageSync('cart', cart)
  },

  loadCart() {
    const cart = wx.getStorageSync('cart') || {}
    this.updateCart(cart)
  },

  goToDetail(e) {
    const id = e.currentTarget.dataset.id
    const allDishes = this.data.categoryDishes.flatMap(cat => cat.dishes)
    const selectedDish = allDishes.find(d => d._id === id)
    
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

  stopPropagation() {
    return false
  },

  toggleCartDrawer() {
    this.setData({
      showCartDrawer: !this.data.showCartDrawer
    })
  },

  goToCheckout() {
    this.setData({
      showCartDrawer: false
    })
    wx.navigateTo({
      url: '/packageOrder/cart/cart'
    })
  }
})
