function formatPrice(price) {
  return parseFloat(price).toFixed(2)
}

function formatTime(timestamp) {
  const date = new Date(timestamp)
  const year = date.getFullYear()
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const day = date.getDate().toString().padStart(2, '0')
  const hour = date.getHours().toString().padStart(2, '0')
  const minute = date.getMinutes().toString().padStart(2, '0')
  const second = date.getSeconds().toString().padStart(2, '0')
  return `${year}-${month}-${day} ${hour}:${minute}:${second}`
}

function formatShortTime(timestamp) {
  const date = new Date(timestamp)
  const month = date.getMonth() + 1
  const day = date.getDate()
  const hour = date.getHours().toString().padStart(2, '0')
  const minute = date.getMinutes().toString().padStart(2, '0')
  return `${month}月${day}日 ${hour}:${minute}`
}

function getStatusText(status) {
  const statusMap = {
    0: '待支付',
    1: '制作中',
    2: '已出餐',
    3: '已完成',
    4: '已取消'
  }
  return statusMap[status] || '未知'
}

function getStatusDesc(status) {
  const descMap = {
    0: '请尽快完成支付',
    1: '商家正在为您准备美食',
    2: '美食已准备好，请耐心等待',
    3: '订单已完成，感谢您的光临',
    4: '订单已取消'
  }
  return descMap[status] || ''
}

function showToast(title, icon = 'none', duration = 2000) {
  wx.showToast({
    title,
    icon,
    duration
  })
}

function showLoading(title = '加载中...') {
  wx.showLoading({
    title,
    mask: true
  })
}

function hideLoading() {
  wx.hideLoading()
}

function showModal(title, content, confirmText = '确定', cancelText = '取消') {
  return new Promise((resolve) => {
    wx.showModal({
      title,
      content,
      confirmText,
      cancelText,
      success: (res) => {
        resolve(res.confirm)
      }
    })
  })
}

function navigateTo(url) {
  wx.navigateTo({
    url,
    fail: () => {
      wx.switchTab({ url })
    }
  })
}

function generateOrderNo() {
  const now = new Date()
  const year = now.getFullYear()
  const month = (now.getMonth() + 1).toString().padStart(2, '0')
  const day = now.getDate().toString().padStart(2, '0')
  const hour = now.getHours().toString().padStart(2, '0')
  const minute = now.getMinutes().toString().padStart(2, '0')
  const second = now.getSeconds().toString().padStart(2, '0')
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
  return `${year}${month}${day}${hour}${minute}${second}${random}`
}

function debounce(func, wait) {
  let timeout
  return function(...args) {
    clearTimeout(timeout)
    timeout = setTimeout(() => {
      func.apply(this, args)
    }, wait)
  }
}

function throttle(func, wait) {
  let timeout
  return function(...args) {
    if (!timeout) {
      timeout = setTimeout(() => {
        timeout = null
        func.apply(this, args)
      }, wait)
    }
  }
}

module.exports = {
  formatPrice,
  formatTime,
  formatShortTime,
  getStatusText,
  getStatusDesc,
  showToast,
  showLoading,
  hideLoading,
  showModal,
  navigateTo,
  generateOrderNo,
  debounce,
  throttle
}