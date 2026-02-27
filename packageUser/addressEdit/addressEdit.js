Page({
  data: {
    addressId: '',
    region: [],
    formData: {
      name: '',
      phone: '',
      province: '',
      city: '',
      district: '',
      detail: '',
      isDefault: false
    }
  },

  onLoad(options) {
    if (options.id) {
      this.loadAddress(options.id)
    }
  },

  async loadAddress(id) {
    try {
      const res = await wx.cloud.callFunction({
        name: 'getAddresses'
      })

      if (res.result.success) {
        const address = res.result.addresses.find(addr => addr._id === id)
        if (address) {
          this.setData({
            addressId: id,
            region: [address.province, address.city, address.district],
            formData: {
              name: address.name,
              phone: address.phone,
              province: address.province,
              city: address.city,
              district: address.district,
              detail: address.detail,
              isDefault: address.isDefault
            }
          })
        }
      }
    } catch (err) {
      console.error('加载地址失败', err)
    }
  },

  onInput(e) {
    const field = e.currentTarget.dataset.field
    const value = e.detail.value
    this.setData({
      [`formData.${field}`]: value
    })
  },

  onRegionChange(e) {
    const region = e.detail.value
    this.setData({
      region,
      'formData.province': region[0],
      'formData.city': region[1],
      'formData.district': region[2]
    })
  },

  onDefaultChange() {
    this.setData({
      'formData.isDefault': !this.data.formData.isDefault
    })
  },

  async saveAddress() {
    const { formData } = this.data

    if (!formData.name) {
      wx.showToast({
        title: '请输入联系人姓名',
        icon: 'none'
      })
      return
    }

    if (!formData.phone) {
      wx.showToast({
        title: '请输入手机号',
        icon: 'none'
      })
      return
    }

    if (!/^1[3-9]\d{9}$/.test(formData.phone)) {
      wx.showToast({
        title: '手机号格式不正确',
        icon: 'none'
      })
      return
    }

    if (!formData.province || !formData.city || !formData.district) {
      wx.showToast({
        title: '请选择所在地区',
        icon: 'none'
      })
      return
    }

    if (!formData.detail) {
      wx.showToast({
        title: '请输入详细地址',
        icon: 'none'
      })
      return
    }

    wx.showLoading({
      title: '保存中...'
    })

    try {
      const cloudFunctionName = this.data.addressId ? 'updateAddress' : 'addAddress'
      const data = this.data.addressId 
        ? { ...formData, addressId: this.data.addressId }
        : formData

      const res = await wx.cloud.callFunction({
        name: cloudFunctionName,
        data
      })

      wx.hideLoading()

      if (res.result.success) {
        wx.showToast({
          title: '保存成功',
          icon: 'success',
          duration: 1500,
          success: () => {
            setTimeout(() => {
              wx.navigateBack()
            }, 1500)
          }
        })
      } else {
        wx.showToast({
          title: res.result.message || '保存失败',
          icon: 'none'
        })
      }
    } catch (err) {
      wx.hideLoading()
      console.error('保存地址失败', err)
      wx.showToast({
        title: '保存失败，请重试',
        icon: 'none'
      })
    }
  },

  deleteAddress() {
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
              data: { addressId: this.data.addressId }
            })

            wx.hideLoading()

            if (res.result.success) {
              wx.showToast({
                title: '删除成功',
                icon: 'success',
                duration: 1500,
                success: () => {
                  setTimeout(() => {
                    wx.navigateBack()
                  }, 1500)
                }
              })
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
