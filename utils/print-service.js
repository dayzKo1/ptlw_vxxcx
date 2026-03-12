/**
 * 打印服务
 * 整合蓝牙打印机和打印模板
 */

const printer = require('./bluetooth-printer.js')
const printTemplate = require('./print-template.js')

class PrintService {
  constructor() {
    this.initialized = false
    this.autoPrint = true // 是否自动打印新订单
  }

  /**
   * 初始化
   */
  async init() {
    if (this.initialized) return { success: true }
    
    const res = await printer.init()
    if (res.success) {
      this.initialized = true
    }
    return res
  }

  /**
   * 搜索打印机
   */
  async searchPrinters() {
    await this.init()
    
    const startRes = await printer.startDiscovery()
    if (!startRes.success) {
      return startRes
    }

    // 等待搜索
    await this.sleep(2000)

    const devicesRes = await printer.getDevices()
    await printer.stopDiscovery()

    return devicesRes
  }

  /**
   * 连接打印机
   */
  async connectPrinter(deviceId, deviceName) {
    await this.init()
    
    const res = await printer.connect(deviceId)
    if (res.success) {
      printer.savePrinter(deviceId, deviceName)
    }
    return res
  }

  /**
   * 自动连接已保存的打印机
   */
  async autoConnect() {
    const savedDeviceId = printer.getSavedPrinter()
    if (!savedDeviceId) {
      return { success: false, message: '未找到已保存的打印机' }
    }

    return await this.connectPrinter(savedDeviceId)
  }

  /**
   * 断开打印机
   */
  async disconnectPrinter() {
    await printer.disconnect()
    printer.clearSavedPrinter()
    return { success: true }
  }

  /**
   * 获取已连接的打印机名称
   */
  getConnectedPrinterName() {
    return wx.getStorageSync('bluetoothPrinterName') || ''
  }

  /**
   * 检查是否已连接
   */
  isConnected() {
    return printer.isConnected()
  }

  /**
   * 打印订单小票
   */
  async printOrder(order, shopInfo = {}) {
    if (!printer.isConnected()) {
      // 尝试自动连接
      const connectRes = await this.autoConnect()
      if (!connectRes.success) {
        return { success: false, message: '打印机未连接，请先连接打印机' }
      }
    }

    // 生成打印数据
    const buffer = printTemplate.generateOrderReceipt(order, shopInfo)
    
    // 发送打印
    const result = await printer.print(buffer)
    return result
  }

  /**
   * 打印后厨单
   */
  async printKitchenTicket(order) {
    if (!printer.isConnected()) {
      const connectRes = await this.autoConnect()
      if (!connectRes.success) {
        return { success: false, message: '打印机未连接' }
      }
    }

    const buffer = printTemplate.generateKitchenTicket(order)
    return await printer.print(buffer)
  }

  /**
   * 打印订单（同时打印小票和后厨单）
   */
  async printOrderAll(order, shopInfo = {}) {
    // 打印小票
    const receiptRes = await this.printOrder(order, shopInfo)
    
    // 等待一会儿
    await this.sleep(500)
    
    // 打印后厨单
    const kitchenRes = await this.printKitchenTicket(order)

    return {
      success: receiptRes.success && kitchenRes.success,
      receipt: receiptRes,
      kitchen: kitchenRes
    }
  }

  /**
   * 测试打印
   */
  async testPrint() {
    if (!printer.isConnected()) {
      const connectRes = await this.autoConnect()
      if (!connectRes.success) {
        return { success: false, message: '打印机未连接' }
      }
    }

    // 生成测试数据
    const testOrder = {
      orderNo: 'TEST-' + Date.now(),
      orderType: 'T',
      tableNumber: '1',
      createTime: Date.now(),
      items: [
        { name: '红烧肉', quantity: 1, price: 68 },
        { name: '宫保鸡丁', quantity: 2, price: 38 }
      ],
      totalPrice: 144
    }

    return await this.printOrder(testOrder, { name: '测试店铺' })
  }

  /**
   * 设置自动打印
   */
  setAutoPrint(enabled) {
    this.autoPrint = enabled
    wx.setStorageSync('autoPrint', enabled)
  }

  /**
   * 获取自动打印设置
   */
  getAutoPrint() {
    return wx.getStorageSync('autoPrint') !== false
  }

  /**
   * 延迟函数
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}

// 创建单例
const printService = new PrintService()

module.exports = printService