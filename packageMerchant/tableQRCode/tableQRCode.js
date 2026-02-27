const app = getApp()

Page({
  data: {
    tables: [],
    loading: false,
    generating: false
  },

  onLoad() {
    this.loadTables()
  },

  async loadTables() {
    this.setData({ loading: true })

    try {
      const res = await wx.cloud.callFunction({
        name: 'getTables'
      })

      if (res.result.success) {
        this.setData({
          tables: res.result.tables
        })
      }
    } catch (err) {
      console.error('加载桌号失败', err)
      wx.showToast({
        title: '加载失败',
        icon: 'none'
      })
    } finally {
      this.setData({ loading: false })
    }
  },

  async generateQRCode(e) {
    const tableNumber = e.currentTarget.dataset.tableNumber

    this.setData({ generating: true })

    try {
      const res = await wx.cloud.callFunction({
        name: 'generateTableQRCode',
        data: {
          tableNumber: tableNumber
        }
      })

      if (res.result.success) {
        wx.showToast({
          title: '生成成功',
          icon: 'success'
        })
        this.loadTables()
      } else {
        wx.showToast({
          title: res.result.message || '生成失败',
          icon: 'none'
        })
      }
    } catch (err) {
      console.error('生成二维码失败', err)
      wx.showToast({
        title: '生成失败',
        icon: 'none'
      })
    } finally {
      this.setData({ generating: false })
    }
  },

  async batchGenerate() {
    wx.showModal({
      title: '确认',
      content: '确定要为所有桌号生成二维码吗？',
      success: async (res) => {
        if (res.confirm) {
          this.setData({ loading: true })

          try {
            const res = await wx.cloud.callFunction({
              name: 'batchGenerateTableQRCode'
            })

            if (res.result.success) {
              wx.showToast({
                title: `成功生成${res.result.successCount}个二维码`,
                icon: 'success',
                duration: 2000
              })
              setTimeout(() => {
                this.loadTables()
              }, 2000)
            } else {
              wx.showToast({
                title: '批量生成失败',
                icon: 'none'
              })
            }
          } catch (err) {
            console.error('批量生成二维码失败', err)
            wx.showToast({
              title: '批量生成失败',
              icon: 'none'
            })
          } finally {
            this.setData({ loading: false })
          }
        }
      }
    })
  },

  previewImage(e) {
    const url = e.currentTarget.dataset.url
    wx.previewImage({
      urls: [url],
      current: url
    })
  },

  async downloadImage(e) {
    const url = e.currentTarget.dataset.url

    this.setData({ loading: true })

    try {
      const res = await wx.downloadFile({ url: url })
      
      await wx.saveImageToPhotosAlbum({ filePath: res.tempFilePath })
      wx.showToast({
        title: '已保存到相册',
        icon: 'success'
      })
    } catch (err) {
      if (err.errMsg && err.errMsg.includes('auth deny')) {
        wx.showModal({
          title: '提示',
          content: '需要您授权保存图片到相册',
          showCancel: false
        })
      } else {
        wx.showToast({
          title: '保存失败',
          icon: 'none'
        })
      }
    } finally {
      this.setData({ loading: false })
    }
  }
})
