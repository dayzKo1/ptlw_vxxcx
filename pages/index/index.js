const app = getApp()

Page({
  data: {
    shopInfo: {},
    banners: [],
    tableNumber: '',
    distance: ''
  },

  onLoad() {
    this.setData({
      shopInfo: app.globalData.shopInfo
    })
    this.loadBanners()
    this.loadTableNumber()
    this.getLocation()
  },

  loadBanners() {
    this.setData({
      banners: [
        { 
          _id: '1', 
          title: '新店开业', 
          desc: '全场优惠',
          image: '/images/banner/banner1.png' 
        },
        { 
          _id: '2', 
          title: '招牌推荐', 
          desc: '精选人气菜品',
          image: '/images/banner/banner2.png' 
        },
        { 
          _id: '3', 
          title: '限时特惠', 
          desc: '会员专享福利',
          image: '/images/banner/banner3.png' 
        },
        { 
          _id: '4', 
          title: '品质保证', 
          desc: '新鲜食材，用心烹饪',
          image: '/images/banner/banner4.png' 
        }
      ]
    })
  },

  loadTableNumber() {
    const tableNumber = app.globalData.tableNumber || wx.getStorageSync('tableNumber') || ''
    this.setData({ tableNumber })
  },

  goToMenu(e) {
    const mode = e.currentTarget.dataset.mode
    wx.switchTab({
      url: '/pages/menu/menu'
    })
    
    setTimeout(() => {
      const pages = getCurrentPages()
      const menuPage = pages.find(page => page.route === 'pages/menu/menu')
      if (menuPage) {
        if (mode === 'dine-in') {
          menuPage.setData({ deliveryMode: 'pickup' })
        } else if (mode === 'delivery') {
          menuPage.setData({ deliveryMode: 'delivery' })
        }
      }
    }, 100)
  },

  openLocation() {
    const address = this.data.shopInfo.address
    wx.openLocation({
      latitude: this.data.shopInfo.latitude || 0,
      longitude: this.data.shopInfo.longitude || 0,
      name: this.data.shopInfo.name,
      address: address,
      scale: 18
    })
  },

  makeCall() {
    const phone = this.data.shopInfo.phone
    wx.makePhoneCall({
      phoneNumber: phone,
      success: () => {
        console.log('拨打电话成功')
      },
      fail: (err) => {
        console.error('拨打电话失败', err)
        wx.showToast({
          title: '拨打电话失败',
          icon: 'none'
        })
      }
    })
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
  }
})