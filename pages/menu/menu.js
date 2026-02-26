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
      
      this.setData({ 
        categories: res.data,
        currentCategoryId: res.data[0]?._id || ''
      })
      
      if (res.data.length > 0) {
        this.loadAllDishes()
      }
    } catch (err) {
      console.error('加载分类失败', err)
      const mockCategories = [
        { _id: '1', name: '热菜', emoji: '🔥' },
        { _id: '2', name: '凉菜', emoji: '🥗' },
        { _id: '3', name: '主食', emoji: '🍚' }
      ]
      this.setData({
        categories: mockCategories,
        currentCategoryId: '1'
      })
      this.loadMockDishes()
    }
  },

  loadMockDishes() {
    const mockDishes = [
      { _id: '1', categoryId: '1', name: '招牌红烧肉', price: 68, emoji: '🥩', description: '精选五花肉', isHot: true, quantity: 0 },
      { _id: '2', categoryId: '1', name: '宫保鸡丁', price: 38, emoji: '🍗', description: '经典川菜', isHot: true, quantity: 0 },
      { _id: '3', categoryId: '1', name: '清蒸鲈鱼', price: 88, emoji: '🐟', description: '新鲜鲈鱼', quantity: 0 },
      { _id: '4', categoryId: '2', name: '凉拌黄瓜', price: 18, emoji: '🥒', description: '清脆爽口', quantity: 0 },
      { _id: '5', categoryId: '2', name: '皮蛋豆腐', price: 22, emoji: '🥚', description: '嫩滑鲜美', quantity: 0 },
      { _id: '6', categoryId: '3', name: '白米饭', price: 5, emoji: '🍚', description: '东北大米', quantity: 0 },
      { _id: '7', categoryId: '3', name: '炒饭', price: 15, emoji: '🍳', description: '扬州炒饭', quantity: 0 }
    ]
    const categoryDishes = this.data.categories.map(cat => ({
      ...cat,
      dishes: mockDishes.filter(d => d.categoryId === cat._id)
    }))
    this.setData({ categoryDishes })
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
      url: '/pages/checkout/checkout'
    })
  }
})
