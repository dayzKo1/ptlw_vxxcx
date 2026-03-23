App({
  onLaunch(options) {
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力')
    } else {
      wx.cloud.init({
        env: 'cloud1-2gj3ujpj1708bd55', // 指定云开发环境 ID
        traceUser: true,
      })
    }
    
    this.checkLogin()
    this.loadTableNumber(options)
    this.loadShopInfo()
  },
  
  checkLogin() {
    const userInfo = wx.getStorageSync('userInfo')
    if (userInfo) {
      this.globalData.userInfo = userInfo
    }
  },

  loadTableNumber(options) {
    let tableNumber = null
    
    if (options && options.query && options.query.table) {
      tableNumber = options.query.table
      console.log('从URL参数获取桌号:', tableNumber)
    } else if (options && options.scene) {
      const scene = decodeURIComponent(options.scene)
      console.log('场景参数:', scene)
      
      const tableMatch = scene.match(/table=([^&]+)/)
      if (tableMatch) {
        tableNumber = tableMatch[1]
        console.log('从场景参数获取桌号:', tableNumber)
      }
    }
    
    if (tableNumber) {
      wx.setStorageSync('tableNumber', tableNumber)
      this.globalData.tableNumber = tableNumber
      console.log('桌号已保存:', tableNumber)
    } else {
      this.globalData.tableNumber = wx.getStorageSync('tableNumber') || ''
      console.log('使用本地存储的桌号:', this.globalData.tableNumber)
    }
  },

  async loadShopInfo() {
    try {
      const db = wx.cloud.database()
      const res = await db.collection('shopInfo').doc('main').get()
      if (res.data) {
        this.globalData.shopInfo = res.data
      }
    } catch (err) {
      console.error('加载店铺信息失败', err)
      // 保持 globalData 中的默认值，不做任何修改
    }
  },
  
  globalData: {
    userInfo: null,
    tableNumber: '',
    shopInfo: {
      name: '平潭礼物',
      address: '福建省福州市平潭县君山镇北港村新门前16号',
      phone: '181-5919-5897',
      businessHours: '10:00-22:00',
      logo: '',
      latitude: 25.5067,
      longitude: 119.7956,
      deliveryFee: 5,
      minOrderAmount: 20,
      packagingFee: 2
    }
  }
})