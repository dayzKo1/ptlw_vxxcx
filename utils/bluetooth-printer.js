/**
 * 蓝牙打印机工具模块
 * 支持 ESC/POS 协议的蓝牙热敏打印机
 */

class BluetoothPrinter {
  constructor() {
    this.deviceId = null
    this.serviceId = null
    this.characteristicId = null
    this.connected = false
    this.discovering = false
  }

  /**
   * 初始化蓝牙适配器
   */
  async init() {
    try {
      await wx.openBluetoothAdapter()
      console.log('蓝牙适配器初始化成功')
      return { success: true }
    } catch (err) {
      console.error('蓝牙适配器初始化失败', err)
      if (err.errCode === 10001) {
        return { success: false, message: '请开启手机蓝牙' }
      }
      return { success: false, message: '蓝牙初始化失败' }
    }
  }

  /**
   * 开始搜索蓝牙设备
   */
  async startDiscovery() {
    if (this.discovering) {
      return { success: true }
    }

    try {
      await wx.startBluetoothDevicesDiscovery({
        allowDuplicatesKey: false,
        interval: 0
      })
      this.discovering = true
      console.log('开始搜索蓝牙设备')
      return { success: true }
    } catch (err) {
      console.error('搜索蓝牙设备失败', err)
      return { success: false, message: '搜索蓝牙设备失败' }
    }
  }

  /**
   * 停止搜索蓝牙设备
   */
  async stopDiscovery() {
    if (!this.discovering) return

    try {
      await wx.stopBluetoothDevicesDiscovery()
      this.discovering = false
      console.log('停止搜索蓝牙设备')
    } catch (err) {
      console.error('停止搜索失败', err)
    }
  }

  /**
   * 获取发现的蓝牙设备列表
   */
  async getDevices() {
    try {
      const res = await wx.getBluetoothDevices()
      // 过滤出打印机设备（通常名称包含 Printer、Print、PT-、GP- 等）
      const printers = res.devices.filter(device => {
        const name = (device.name || '').toUpperCase()
        return name.includes('PRINTER') || 
               name.includes('PRINT') || 
               name.includes('PT-') || 
               name.includes('GP-') ||
               name.includes('POS') ||
               name.includes('BT') ||
               device.localName
      })
      return { success: true, devices: printers, allDevices: res.devices }
    } catch (err) {
      console.error('获取设备列表失败', err)
      return { success: false, message: '获取设备列表失败' }
    }
  }

  /**
   * 连接蓝牙设备
   */
  async connect(deviceId) {
    try {
      // 停止搜索
      await this.stopDiscovery()

      // 创建连接
      await wx.createBLEConnection({
        deviceId,
        timeout: 10000
      })

      this.deviceId = deviceId
      console.log('蓝牙连接成功', deviceId)

      // 获取服务
      const servicesRes = await wx.getBLEDeviceServices({ deviceId })
      
      // 查找打印服务（通常 UUID 包含 18F0 或 00FF）
      let targetService = null
      for (const service of servicesRes.services) {
        const uuid = service.uuid.toUpperCase()
        if (uuid.includes('18F0') || uuid.includes('00FF') || uuid.includes('FEE7')) {
          targetService = service
          break
        }
      }

      if (!targetService && servicesRes.services.length > 0) {
        targetService = servicesRes.services[0]
      }

      if (!targetService) {
        throw new Error('未找到打印服务')
      }

      this.serviceId = targetService.uuid
      console.log('找到服务', this.serviceId)

      // 获取特征值
      const characteristicsRes = await wx.getBLEDeviceCharacteristics({
        deviceId,
        serviceId: this.serviceId
      })

      // 查找可写特征值
      let targetCharacteristic = null
      for (const char of characteristicsRes.characteristics) {
        if (char.properties.write || char.properties.writeNoResponse) {
          targetCharacteristic = char
          break
        }
      }

      if (!targetCharacteristic && characteristicsRes.characteristics.length > 0) {
        targetCharacteristic = characteristicsRes.characteristics[0]
      }

      if (!targetCharacteristic) {
        throw new Error('未找到可写特征值')
      }

      this.characteristicId = targetCharacteristic.uuid
      this.connected = true
      console.log('找到特征值', this.characteristicId)

      return { success: true, message: '连接成功' }
    } catch (err) {
      console.error('连接失败', err)
      this.connected = false
      return { success: false, message: err.message || '连接失败' }
    }
  }

  /**
   * 断开连接
   */
  async disconnect() {
    if (!this.deviceId) return

    try {
      await wx.closeBLEConnection({ deviceId: this.deviceId })
      this.connected = false
      this.deviceId = null
      this.serviceId = null
      this.characteristicId = null
      console.log('已断开连接')
    } catch (err) {
      console.error('断开连接失败', err)
    }
  }

  /**
   * 发送数据到打印机
   */
  async write(buffer) {
    if (!this.connected || !this.deviceId) {
      return { success: false, message: '打印机未连接' }
    }

    try {
      await wx.writeBLECharacteristicValue({
        deviceId: this.deviceId,
        serviceId: this.serviceId,
        characteristicId: this.characteristicId,
        value: buffer
      })
      return { success: true }
    } catch (err) {
      console.error('写入数据失败', err)
      return { success: false, message: '发送数据失败' }
    }
  }

  /**
   * 发送打印指令（分包发送，每包最大20字节）
   */
  async print(buffer) {
    if (!this.connected) {
      return { success: false, message: '打印机未连接' }
    }

    try {
      // 分包发送
      const chunkSize = 20
      for (let i = 0; i < buffer.length; i += chunkSize) {
        const chunk = buffer.slice(i, i + chunkSize)
        await this.write(chunk)
        // 短暂延迟，确保数据发送完成
        await this.sleep(50)
      }
      return { success: true }
    } catch (err) {
      console.error('打印失败', err)
      return { success: false, message: '打印失败' }
    }
  }

  /**
   * 延迟函数
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * 检查连接状态
   */
  isConnected() {
    return this.connected
  }

  /**
   * 获取已保存的打印机设备ID
   */
  getSavedPrinter() {
    return wx.getStorageSync('bluetoothPrinter')
  }

  /**
   * 保存打印机设备ID
   */
  savePrinter(deviceId, deviceName) {
    wx.setStorageSync('bluetoothPrinter', deviceId)
    wx.setStorageSync('bluetoothPrinterName', deviceName)
  }

  /**
   * 清除保存的打印机
   */
  clearSavedPrinter() {
    wx.removeStorageSync('bluetoothPrinter')
    wx.removeStorageSync('bluetoothPrinterName')
  }
}

// 创建单例
const printer = new BluetoothPrinter()

module.exports = printer