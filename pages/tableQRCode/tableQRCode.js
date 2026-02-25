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
    wx.showLoading({
      title: '加载中...'
    })

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
      wx.hideLoading()
    }
  },

  async generateQRCode(e) {
    const tableNumber = e.currentTarget.dataset.tableNumber

    wx.showLoading({
      title: '生成中...'
    })

    try {
      const res = await wx.cloud.callFunction({
        name: 'generateTableQRCode',
        data: {
          tableNumber: tableNumber
        }
      })

      wx.hideLoading()

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
      wx.hideLoading()
      console.error('生成二维码失败', err)
      wx.showToast({
        title: '生成失败',
        icon: 'none'
      })
    }
  },

  async batchGenerate() {
    wx.showModal({
      title: '确认',
      content: '确定要为所有桌号生成二维码吗？',
      success: async (res) => {
        if (res.confirm) {
          wx.showLoading({
            title: '批量生成中...',
            mask: true
          })

          try {
            const res = await wx.cloud.callFunction({
              name: 'batchGenerateTableQRCode'
            })

            wx.hideLoading()

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
            wx.hideLoading()
            console.error('批量生成二维码失败', err)
            wx.showToast({
              title: '批量生成失败',
              icon: 'none'
            })
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

  downloadImage(e) {
    const url = e.currentTarget.dataset.url
    const tableNumber = e.currentTarget.dataset.tableNumber

    wx.showLoading({
      title: '下载中...'
    })

    wx.downloadFile({
      url: url,
      success: (res) => {
        wx.hideLoading()
        wx.saveImageToPhotosAlbum({
          filePath: res.tempFilePath,
          success: () => {
            wx.showToast({
              title: '已保存到相册',
              icon: 'success'
            })
          },
          fail: (err) => {
            if (err.errMsg.includes('auth deny')) {
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
          }
        })
      },
      fail: (err) => {
        wx.hideLoading()
        console.error('下载失败', err)
        wx.showToast({
          title: '下载失败',
          icon: 'none'
        })
      }
    })
  }
})
