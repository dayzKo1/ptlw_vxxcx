/**
 * 订单打印模板
 * ESC/POS 指令生成器
 */

class PrintTemplate {
  constructor() {
    this.buffer = []
    // ESC/POS 指令
    this.CMD = {
      INIT: [0x1B, 0x40],           // 初始化打印机
      ALIGN_LEFT: [0x1B, 0x61, 0x00],  // 左对齐
      ALIGN_CENTER: [0x1B, 0x61, 0x01], // 居中对齐
      ALIGN_RIGHT: [0x1B, 0x61, 0x02],  // 右对齐
      BOLD_ON: [0x1B, 0x45, 0x01],     // 开启粗体
      BOLD_OFF: [0x1B, 0x45, 0x00],    // 关闭粗体
      DOUBLE_HEIGHT: [0x1B, 0x21, 0x10], // 倍高
      DOUBLE_WIDTH: [0x1B, 0x21, 0x20],  // 倍宽
      NORMAL: [0x1B, 0x21, 0x00],       // 正常字体
      CUT: [0x1D, 0x56, 0x01],          // 切纸
      FEED: [0x1B, 0x64],               // 走纸
    }
    this.PAPER_WIDTH = 32 // 58mm 纸张宽度（字符数）
  }

  /**
   * 添加原始字节
   */
  addBytes(bytes) {
    this.buffer.push(...bytes)
    return this
  }

  /**
   * 添加文本
   */
  addText(text) {
    // 将字符串转换为字节数组（GBK编码）
    const bytes = this.stringToBytes(text)
    this.buffer.push(...bytes)
    return this
  }

  /**
   * 添加换行
   */
  addNewLine(count = 1) {
    for (let i = 0; i < count; i++) {
      this.buffer.push(0x0A)
    }
    return this
  }

  /**
   * 初始化打印机
   */
  init() {
    return this.addBytes(this.CMD.INIT)
  }

  /**
   * 设置对齐方式
   */
  alignLeft() {
    return this.addBytes(this.CMD.ALIGN_LEFT)
  }

  alignCenter() {
    return this.addBytes(this.CMD.ALIGN_CENTER)
  }

  alignRight() {
    return this.addBytes(this.CMD.ALIGN_RIGHT)
  }

  /**
   * 设置字体样式
   */
  bold(on = true) {
    return this.addBytes(on ? this.CMD.BOLD_ON : this.CMD.BOLD_OFF)
  }

  doubleHeight() {
    return this.addBytes(this.CMD.DOUBLE_HEIGHT)
  }

  doubleWidth() {
    return this.addBytes(this.CMD.DOUBLE_WIDTH)
  }

  normal() {
    return this.addBytes(this.CMD.NORMAL)
  }

  /**
   * 添加分割线
   */
  addLine(char = '-') {
    const line = char.repeat(this.PAPER_WIDTH)
    return this.addText(line).addNewLine()
  }

  /**
   * 添加双行分割线
   */
  addDoubleLine() {
    return this.addLine('=')
  }

  /**
   * 添加键值对（左对齐键，右对齐值）
   */
  addKeyValue(key, value, space = 1) {
    const keyStr = String(key)
    const valueStr = String(value)
    const totalSpace = this.PAPER_WIDTH - keyStr.length - valueStr.length
    const padding = ' '.repeat(Math.max(space, totalSpace))
    return this.addText(keyStr + padding + valueStr).addNewLine()
  }

  /**
   * 走纸
   */
  feed(lines = 3) {
    return this.addBytes([...this.CMD.FEED, lines])
  }

  /**
   * 切纸
   */
  cut() {
    return this.addBytes(this.CMD.CUT)
  }

  /**
   * 字符串转字节数组（简化版，支持中文）
   */
  stringToBytes(str) {
    const bytes = []
    for (let i = 0; i < str.length; i++) {
      const charCode = str.charCodeAt(i)
      if (charCode < 128) {
        // ASCII 字符
        bytes.push(charCode)
      } else {
        // 中文字符（简化处理，使用 UTF-8）
        const utf8 = this.encodeUTF8(str[i])
        bytes.push(...utf8)
      }
    }
    return bytes
  }

  /**
   * UTF-8 编码
   */
  encodeUTF8(char) {
    const code = char.charCodeAt(0)
    const bytes = []
    if (code < 0x80) {
      bytes.push(code)
    } else if (code < 0x800) {
      bytes.push(0xC0 | (code >> 6))
      bytes.push(0x80 | (code & 0x3F))
    } else {
      bytes.push(0xE0 | (code >> 12))
      bytes.push(0x80 | ((code >> 6) & 0x3F))
      bytes.push(0x80 | (code & 0x3F))
    }
    return bytes
  }

  /**
   * 获取打印数据
   */
  getBuffer() {
    return new Uint8Array(this.buffer)
  }

  /**
   * 清空缓冲区
   */
  clear() {
    this.buffer = []
    return this
  }

  /**
   * 生成订单小票
   */
  generateOrderReceipt(order, shopInfo = {}) {
    this.clear()
    
    // 初始化
    this.init()

    // 店铺名称（居中、放大、粗体）
    this.alignCenter()
      .bold(true)
      .doubleHeight()
      .doubleWidth()
      .addText(shopInfo.name || '点餐小程序')
      .addNewLine()
      .bold(false)
      .normal()

    // 店铺信息
    if (shopInfo.address) {
      this.addText(shopInfo.address).addNewLine()
    }
    if (shopInfo.phone) {
      this.addText('电话: ' + shopInfo.phone).addNewLine()
    }
    this.addNewLine()

    // 分割线
    this.addDoubleLine()

    // 订单信息
    this.alignLeft()
    
    // 订单类型
    const orderTypeText = order.orderType === 'T' ? '堂食' : 
                          order.orderType === 'P' ? '自取' : '外卖'
    this.addKeyValue('订单类型:', orderTypeText)

    // 订单号
    this.addKeyValue('订单号:', order.orderNo || order._id)

    // 桌号（堂食时显示）
    if (order.orderType === 'T' && order.tableNumber) {
      this.addKeyValue('桌号:', order.tableNumber + '号桌')
    }

    // 下单时间
    this.addKeyValue('下单时间:', this.formatTime(order.createTime))

    // 分割线
    this.addLine()

    // 菜品列表
    this.bold(true).addText('菜品').addNewLine().bold(false)
    
    // 表头
    this.addText('商品名称').addText('        数量  单价').addNewLine()
    this.addLine()

    // 菜品明细
    let totalQuantity = 0
    if (order.items && order.items.length > 0) {
      order.items.forEach(item => {
        const name = item.name || ''
        const quantity = item.quantity || 1
        const price = (item.price || 0).toFixed(2)
        totalQuantity += quantity
        
        // 名称（最多10个字符）
        const displayName = name.length > 10 ? name.substring(0, 10) : name
        const padding = ' '.repeat(Math.max(1, 14 - displayName.length))
        
        this.addText(displayName)
          .addText(padding)
          .addText(String(quantity).padStart(3))
          .addText('  ')
          .addText(price.padStart(7))
          .addNewLine()
      })
    }

    // 分割线
    this.addLine()

    // 统计
    this.addKeyValue('共', totalQuantity + ' 件')
    
    // 配送费（外卖时显示）
    if (order.orderType === 'D' && order.deliveryFee > 0) {
      this.addKeyValue('配送费:', '¥' + order.deliveryFee.toFixed(2))
    }

    // 合计
    this.bold(true)
    this.addKeyValue('合计:', '¥' + (order.totalPrice || 0).toFixed(2))
    this.bold(false)

    // 备注
    if (order.remark) {
      this.addNewLine()
        .bold(true)
        .addText('备注: ' + order.remark)
        .addNewLine()
        .bold(false)
    }

    // 分割线
    this.addNewLine()
    this.addDoubleLine()

    // 底部信息
    this.alignCenter()
      .addText('感谢您的光临，欢迎再次使用!')
      .addNewLine()
      .addText(this.formatDate(new Date()))
      .addNewLine()

    // 走纸并切纸
    this.feed(3)
    this.cut()

    return this.getBuffer()
  }

  /**
   * 生成后厨打印单（仅菜品，不含价格）
   */
  generateKitchenTicket(order) {
    this.clear()
    this.init()

    // 标题
    this.alignCenter()
      .bold(true)
      .doubleHeight()
      .addText('后厨单')
      .addNewLine()
      .bold(false)
      .normal()

    // 订单信息
    this.alignLeft()
      .addLine('-')

    // 订单号和桌号
    const orderTypeText = order.orderType === 'T' ? '堂食' : 
                          order.orderType === 'P' ? '自取' : '外卖'
    this.addKeyValue('类型:', orderTypeText)
    this.addKeyValue('订单号:', order.orderNo || order._id)
    
    if (order.orderType === 'T' && order.tableNumber) {
      this.bold(true)
        .doubleHeight()
        .addKeyValue('桌号:', order.tableNumber + '号')
        .normal()
        .bold(false)
    }

    this.addLine('-')

    // 菜品列表（大字体）
    this.bold(true)
    
    if (order.items && order.items.length > 0) {
      order.items.forEach(item => {
        const quantity = item.quantity || 1
        this.addText(item.name)
          .addText('  x')
          .addText(String(quantity))
          .addNewLine()
      })
    }

    this.bold(false)

    // 备注
    if (order.remark) {
      this.addNewLine()
        .addLine('*')
        .bold(true)
        .addText('备注: ' + order.remark)
        .addNewLine()
        .bold(false)
        .addLine('*')
    }

    // 时间
    this.addNewLine()
      .addText(this.formatTime(order.createTime))
      .addNewLine()

    // 走纸切纸
    this.feed(3).cut()

    return this.getBuffer()
  }

  /**
   * 格式化时间
   */
  formatTime(timestamp) {
    const date = new Date(timestamp)
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    const day = date.getDate().toString().padStart(2, '0')
    const hour = date.getHours().toString().padStart(2, '0')
    const minute = date.getMinutes().toString().padStart(2, '0')
    return `${month}-${day} ${hour}:${minute}`
  }

  /**
   * 格式化日期
   */
  formatDate(date) {
    const year = date.getFullYear()
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    const day = date.getDate().toString().padStart(2, '0')
    return `${year}年${month}月${day}日`
  }
}

// 创建单例
const printTemplate = new PrintTemplate()

module.exports = printTemplate