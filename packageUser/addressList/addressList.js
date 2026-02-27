Page({
  data: {
    addresses: []
  },

  onLoad() {
    this.loadAddresses()
  },

  onShow() {
    this.loadAddresses()
  },

  async loadAddresses() {
    try {
      const res = await wx.cloud.callFunction({
        name: 'getAddresses'
      })

      if (res.result.success) {
        this.setData({ addresses: res.result.addresses })
      }
    } catch (err) {
      console.error('加载地址失败', err)
      wx.showToast({
        title: '加载失败',
        icon: 'none'
      })
    }
  },

  addAddress() {
    wx.navigateTo({
      url: '/packageUser/addressEdit/addressEdit'
    })
  },

  editAddress(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({
      url: `/packageUser/addressEdit/addressEdit?id=${id}`
    })
  },

  selectAddress(e) {
    const id = e.currentTarget.dataset.id
    const address = this.data.addresses.find(addr => addr._id === id)
    if (address) {
      wx.setStorageSync('selectedAddress', address)
      wx.navigateBack()
    }
  },

  async setDefaultAddress(e) {
    const id = e.currentTarget.dataset.id
    const address = this.data.addresses.find(addr => addr._id === id)
    
    if (address && address.isDefault) {
      wx.showToast({
        title: '该地址已是默认地址',
        icon: 'none'
      })
      return
    }
    
    wx.showLoading({
      title: '设置中...'
    })
    
    try {
      const res = await wx.cloud.callFunction({
        name: 'setDefaultAddress',
        data: { addressId: id }
      })
      
      wx.hideLoading()
      
      if (res.result.success) {
        wx.showToast({
          title: '设置成功',
          icon: 'success'
        })
        this.loadAddresses()
      } else {
        wx.showToast({
          title: res.result.message || '设置失败',
          icon: 'none'
        })
      }
    } catch (err) {
      wx.hideLoading()
      console.error('设置默认地址失败', err)
      wx.showToast({
        title: '设置失败，请重试',
        icon: 'none'
      })
    }
  },

  deleteAddress(e) {
    const id = e.currentTarget.dataset.id
    wx.showModal({
      title: '提示',
      content: '确定要删除这个地址吗？',
      success: async (res) => {
        if (res.confirm) {
          wx.showLoading({
            title: '删除中...'
          })

          try {
            const res = await wx.cloud.callFunction({
              name: 'deleteAddress',
              data: { addressId: id }
            })

            wx.hideLoading()

            if (res.result.success) {
              wx.showToast({
                title: '删除成功',
                icon: 'success'
              })
              this.loadAddresses()
            } else {
              wx.showToast({
                title: res.result.message || '删除失败',
                icon: 'none'
              })
            }
          } catch (err) {
            wx.hideLoading()
            console.error('删除地址失败', err)
            wx.showToast({
              title: '删除失败，请重试',
              icon: 'none'
            })
          }
        }
      }
    })
  }
})
