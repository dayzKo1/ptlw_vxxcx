const printService = require('../../utils/print-service.js')
const notification = require('../../utils/order-notification.js')

Page({
  data: {
    connected: false,
    connectedPrinter: '',
    devices: [],
    searching: false,
    searched: false,
    autoPrint: true,
    printKitchen: true,
    voiceEnabled: true
  },

  onLoad() {
    this.loadSettings()
    this.checkConnection()
  },

  onShow() {
    this.checkConnection()
  },

  onUnload() {
    // 停止搜索
    printService.stopSearch && printService.stopSearch()
  },

  loadSettings() {
    this.setData({
      autoPrint: wx.getStorageSync('autoPrint') !== false,
      printKitchen: wx.getStorageSync('printKitchen') !== false,
      voiceEnabled: wx.getStorageSync('orderNotification') !== false
    })
  },

  async checkConnection() {
    const connected = printService.isConnected()
    const connectedPrinter = printService.getConnectedPrinterName()
    
    this.setData({
      connected,
      connectedPrinter: connected ? connectedPrinter : ''
    })
  },

  async searchPrinters() {
    this.setData({ searching: true, searched: false, devices: [] })

    try {
      const result = await printService.searchPrinters()
      
      if (result.success) {
        this.setData({
          devices: result.devices || [],
          searched: true
        })
      } else {
        wx.showToast({
          title: result.message || '搜索失败',
          icon: 'none'
        })
      }
    } catch (err) {
      console.error('搜索打印机失败', err)
      wx.showToast({
        title: '搜索失败，请检查蓝牙',
        icon: 'none'
      })
    } finally {
      this.setData({ searching: false })
    }
  },

  async connectPrinter(e) {
    const device = e.currentTarget.dataset.device
    const deviceId = device.deviceId
    const deviceName = device.name || device.localName || '打印机'

    wx.showLoading({ title: '连接中...' })

    try {
      const result = await printService.connectPrinter(deviceId, deviceName)
      
      wx.hideLoading()

      if (result.success) {
        wx.showToast({
          title: '连接成功',
          icon: 'success'
        })
        
        this.setData({
          connected: true,
          connectedPrinter: deviceName
        })
      } else {
        wx.showToast({
          title: result.message || '连接失败',
          icon: 'none'
        })
      }
    } catch (err) {
      wx.hideLoading()
      console.error('连接打印机失败', err)
      wx.showToast({
        title: '连接失败，请重试',
        icon: 'none'
      })
    }
  },

  async disconnectPrinter() {
    wx.showModal({
      title: '提示',
      content: '确定要断开打印机连接吗？',
      success: async (res) => {
        if (res.confirm) {
          await printService.disconnectPrinter()
          
          this.setData({
            connected: false,
            connectedPrinter: ''
          })
          
          wx.showToast({
            title: '已断开连接',
            icon: 'success'
          })
        }
      }
    })
  },

  async testPrint() {
    if (!this.data.connected) {
      wx.showToast({
        title: '请先连接打印机',
        icon: 'none'
      })
      return
    }

    wx.showLoading({ title: '打印中...' })

    try {
      const result = await printService.testPrint()
      
      wx.hideLoading()

      if (result.success) {
        wx.showToast({
          title: '打印成功',
          icon: 'success'
        })
      } else {
        wx.showToast({
          title: result.message || '打印失败',
          icon: 'none'
        })
      }
    } catch (err) {
      wx.hideLoading()
      console.error('测试打印失败', err)
      wx.showToast({
        title: '打印失败，请重试',
        icon: 'none'
      })
    }
  },

  toggleAutoPrint(e) {
    const enabled = e.detail.value
    printService.setAutoPrint(enabled)
    this.setData({ autoPrint: enabled })
  },

  togglePrintKitchen(e) {
    const enabled = e.detail.value
    wx.setStorageSync('printKitchen', enabled)
    this.setData({ printKitchen: enabled })
  },

  toggleVoice(e) {
    const enabled = e.detail.value
    notification.setEnabled(enabled)
    this.setData({ voiceEnabled: enabled })
  }
})