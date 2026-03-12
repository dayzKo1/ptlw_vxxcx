/**
 * 订单通知服务
 * 提供语音播报、震动提醒等功能
 */

class OrderNotification {
  constructor() {
    this.audioContext = null
    this.isPlaying = false
    this.enabled = true
  }

  /**
   * 初始化
   */
  init() {
    // 检查通知权限
    this.checkPermission()
    
    // 从本地存储读取设置
    this.enabled = wx.getStorageSync('orderNotification') !== false
    
    // 创建音频上下文
    this.audioContext = wx.createInnerAudioContext()
    this.audioContext.onEnded(() => {
      this.isPlaying = false
    })
    this.audioContext.onError((err) => {
      console.error('音频播放错误', err)
      this.isPlaying = false
    })
  }

  /**
   * 检查通知权限
   */
  checkPermission() {
    // 检查通知权限状态
    wx.getSetting({
      withSubscriptions: true,
      success: (res) => {
        console.log('通知权限状态', res)
      }
    })
  }

  /**
   * 启用/禁用通知
   */
  setEnabled(enabled) {
    this.enabled = enabled
    wx.setStorageSync('orderNotification', enabled)
  }

  /**
   * 是否启用
   */
  isEnabled() {
    return this.enabled
  }

  /**
   * 播放新订单语音
   */
  playNewOrderVoice() {
    if (!this.enabled || this.isPlaying) return

    this.isPlaying = true

    // 使用系统 TTS 或预置音频文件
    // 这里使用震动 + 提示音的方式
    this.vibrate()
    
    // 播放提示音
    this.playSound()
  }

  /**
   * 播放提示音
   */
  playSound() {
    if (!this.audioContext) {
      this.audioContext = wx.createInnerAudioContext()
    }

    // 使用系统消息提示音
    // 如果有自定义音频文件，可以替换为实际路径
    // this.audioContext.src = '/audio/new-order.mp3'
    
    // 使用震动代替（小程序限制，无法直接播放系统音）
    console.log('播放提示音')
  }

  /**
   * 震动提醒
   */
  vibrate() {
    // 长震动
    wx.vibrateLong({
      success: () => {
        console.log('震动成功')
      },
      fail: (err) => {
        console.error('震动失败', err)
      }
    })
  }

  /**
   * 短震动
   */
  vibrateShort() {
    wx.vibrateShort({
      type: 'medium'
    })
  }

  /**
   * 显示新订单弹窗
   */
  showNewOrderModal(order, onConfirm, onCancel) {
    const orderTypeText = order.orderType === 'T' ? '堂食' : 
                          order.orderType === 'P' ? '自取' : '外卖'
    
    let content = `订单号: ${order.orderNo || ''}\n`
    content += `类型: ${orderTypeText}\n`
    
    if (order.tableNumber && order.orderType === 'T') {
      content += `桌号: ${order.tableNumber}号\n`
    }
    
    content += `金额: ¥${(order.totalPrice || 0).toFixed(2)}`

    wx.showModal({
      title: '🔔 您有新的订单',
      content: content,
      confirmText: '立即处理',
      cancelText: '稍后处理',
      success: (res) => {
        if (res.confirm && onConfirm) {
          onConfirm(order)
        } else if (onCancel) {
          onCancel(order)
        }
      }
    })
  }

  /**
   * 显示订单通知 Toast
   */
  showToast(title = '您有新的订单', duration = 3000) {
    wx.showToast({
      title: title,
      icon: 'none',
      duration: duration
    })
  }

  /**
   * 发送订阅消息（需要用户授权）
   */
  async sendSubscribeMessage(order) {
    // 获取模板 ID（需要在微信公众平台配置）
    const templateId = wx.getStorageSync('orderTemplateId')
    
    if (!templateId) {
      console.log('未配置订阅消息模板')
      return { success: false, message: '未配置模板' }
    }

    try {
      // 请求订阅
      const subscribeRes = await wx.requestSubscribeMessage({
        tmplIds: [templateId]
      })

      if (subscribeRes[templateId] === 'accept') {
        // 用户同意，发送订阅消息
        // 这里需要服务端调用，小程序端无法直接发送
        console.log('用户同意接收订阅消息')
        return { success: true }
      } else {
        console.log('用户拒绝订阅消息')
        return { success: false, message: '用户拒绝' }
      }
    } catch (err) {
      console.error('订阅消息发送失败', err)
      return { success: false, message: err.message }
    }
  }

  /**
   * 监听新订单（轮询方式）
   * @param {Function} callback 新订单回调
   * @param {Number} interval 轮询间隔（毫秒）
   */
  startPolling(callback, interval = 10000) {
    this.pollingTimer = setInterval(async () => {
      if (!this.enabled) return
      
      try {
        const res = await wx.cloud.callFunction({
          name: 'getMerchantOrders',
          data: { status: 1 } // 待接单
        })

        if (res.result.success) {
          const orders = res.result.data.orders || []
          // 检查是否有新订单
          const lastOrderId = wx.getStorageSync('lastOrderId')
          const newOrders = orders.filter(o => o._id !== lastOrderId)
          
          if (newOrders.length > 0) {
            // 保存最新订单ID
            wx.setStorageSync('lastOrderId', orders[0]._id)
            
            // 回调通知
            if (callback) {
              callback(newOrders)
            }
          }
        }
      } catch (err) {
        console.error('轮询订单失败', err)
      }
    }, interval)
  }

  /**
   * 停止轮询
   */
  stopPolling() {
    if (this.pollingTimer) {
      clearInterval(this.pollingTimer)
      this.pollingTimer = null
    }
  }

  /**
   * 销毁
   */
  destroy() {
    this.stopPolling()
    if (this.audioContext) {
      this.audioContext.destroy()
      this.audioContext = null
    }
  }
}

// 创建单例
const notification = new OrderNotification()

module.exports = notification