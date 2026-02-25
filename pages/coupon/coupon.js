Page({
  data: {
    activeTab: 'available',
    coupons: [],
    emptyText: '暂无可用优惠券'
  },

  onLoad() {
    this.loadCoupons()
  },

  switchTab(e) {
    const tab = e.currentTarget.dataset.tab
    this.setData({ activeTab: tab })
    this.loadCoupons()
  },

  loadCoupons() {
    const mockCoupons = {
      available: [
        {
          _id: '1',
          name: '新用户专享券',
          amount: 10,
          condition: 50,
          startTime: '2024-01-01',
          endTime: '2024-12-31',
          status: 'available'
        },
        {
          _id: '2',
          name: '满减优惠券',
          amount: 20,
          condition: 100,
          startTime: '2024-01-01',
          endTime: '2024-12-31',
          status: 'available'
        }
      ],
      used: [
        {
          _id: '3',
          name: '首单优惠券',
          amount: 15,
          condition: 60,
          startTime: '2024-01-01',
          endTime: '2024-12-31',
          status: 'used'
        }
      ],
      expired: [
        {
          _id: '4',
          name: '限时优惠券',
          amount: 5,
          condition: 30,
          startTime: '2023-01-01',
          endTime: '2023-12-31',
          status: 'expired'
        }
      ]
    }

    const emptyTextMap = {
      available: '暂无可用优惠券',
      used: '暂无已使用优惠券',
      expired: '暂无已过期优惠券'
    }

    this.setData({
      coupons: mockCoupons[this.data.activeTab] || [],
      emptyText: emptyTextMap[this.data.activeTab]
    })
  },

  useCoupon(e) {
    const id = e.currentTarget.dataset.id
    wx.switchTab({
      url: '/pages/menu/menu'
    })
    wx.showToast({
      title: '请选择商品使用',
      icon: 'none'
    })
  }
})
