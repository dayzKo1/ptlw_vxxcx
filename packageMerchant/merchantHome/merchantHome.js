const app = getApp()
const api = require('../../utils/merchant-api.js')
const printService = require('../../utils/print-service.js')
const notification = require('../../utils/order-notification.js')

Page({
  data: {
    currentTab: 'order',
    userInfo: null,
    shopInfo: {},
    stats: {},
    orders: [],
    groupedOrders: [],
    dishes: [],
    tables: [],
    categories: [],
    printerConnected: false,

    // 日期筛选
    filterDate: '',
    today: '',
    yesterday: '',

    // 筛选状态
    orderStatus: -1,
    dishStatus: 'all',
    tableStatus: 'all',
    tableViewMode: 'grid', // 'grid' | 'list'
    tableStats: {
      total: 0,
      idle: 0,
      occupied: 0
    },

    // 状态配置
    orderStatusList: [
      { value: -1, label: '全部' },
      { value: 0, label: '待支付' },
      { value: 1, label: '待接单' },
      { value: 2, label: '制作中' },
      { value: 3, label: '已出餐' },
      { value: 4, label: '已完成' },
      { value: 5, label: '已取消' },
      { value: 6, label: '已退款' }
    ],

    // UI状态
    loading: false,
    refreshing: false,
    generating: false,
    showDishModal: false,
    showTableModal: false,
    editingDish: null,
    editingTable: null
  },

  onLoad() {
    this.initDateFilter()
    this.checkMerchantRole()
    notification.init()
  },

  initDateFilter() {
    const now = new Date()
    const today = this.formatDate(now)
    const yesterday = this.formatDate(new Date(now.getTime() - 24 * 60 * 60 * 1000))
    this.setData({ today, yesterday, filterDate: today })
  },

  formatDate(date) {
    const year = date.getFullYear()
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    const day = date.getDate().toString().padStart(2, '0')
    return `${year}-${month}-${day}`
  },

  onShow() {
    this.initData()
    this.checkPrinterStatus()
  },

  onUnload() {
    notification.destroy()
  },

  onPullDownRefresh() {
    this.initData().then(() => {
      wx.stopPullDownRefresh()
    })
  },

  checkMerchantRole() {
    const userInfo = wx.getStorageSync('userInfo')
    if (!userInfo) {
      wx.redirectTo({ url: '/pages/login/login' })
      return
    }
    if (userInfo.role !== 'merchant') {
      wx.showModal({
        title: '提示',
        content: '此页面仅限商户访问',
        showCancel: false,
        success: () => {
          wx.switchTab({ url: '/pages/index/index' })
        }
      })
      return
    }
    this.setData({ userInfo })
  },

  async initData() {
    this.setData({ loading: true })

    try {
      const [stats, categories, shopInfo] = await Promise.all([
        api.getStats(),
        api.getCategories(),
        api.getShopInfo()
      ])

      this.setData({
        stats,
        categories,
        shopInfo: shopInfo.success ? shopInfo.data : {}
      })

      await this.loadCurrentTabData()
    } catch (err) {
      console.error('初始化数据失败', err)
    } finally {
      this.setData({ loading: false })
    }
  },

  loadCurrentTabData() {
    const { currentTab } = this.data
    switch (currentTab) {
      case 'order':
        return this.loadOrders()
      case 'dish':
        return this.loadDishes()
      case 'table':
        return this.loadTables()
    }
  },

  // ==================== Tab切换 ====================

  switchTab(e) {
    const tab = e.currentTarget.dataset.tab
    this.setData({ currentTab: tab })
    this.loadCurrentTabData()
  },

  switchOrderStatus(e) {
    const status = parseInt(e.currentTarget.dataset.status)
    this.setData({ orderStatus: status })
    this.loadOrders()
  },

  switchDishStatus(e) {
    const status = e.currentTarget.dataset.status
    this.setData({ dishStatus: status })
    this.loadDishes()
  },

  switchTableStatus(e) {
    const status = e.currentTarget.dataset.status
    this.setData({ tableStatus: status })
    this.loadTables()
  },

  switchTableView(e) {
    const mode = e.currentTarget.dataset.mode
    this.setData({ tableViewMode: mode })
  },

  onTableGridTap(e) {
    const { table } = e.currentTarget.dataset
    if (!table) return

    wx.showActionSheet({
      itemList: [
        table.status === 1 ? '设为空闲' : '设为使用中',
        '生成二维码',
        '编辑桌号',
        '删除桌号'
      ],
      success: (res) => {
        switch (res.tapIndex) {
          case 0:
            this.handleTableToggle({ detail: { table } })
            break
          case 1:
            this.handleTableGenerateQR({ detail: { table } })
            break
          case 2:
            this.showEditTableModal({ detail: { table } })
            break
          case 3:
            this.handleTableDelete({ detail: { table } })
            break
        }
      }
    })
  },

  // ==================== 数据加载 ====================

  async loadOrders() {
    try {
      let orders = await api.getOrders(this.data.orderStatus, this.data.filterDate, '')
      
      // 按日期筛选（前端二次筛选，云函数已支持）
      if (this.data.filterDate) {
        orders = this.filterOrdersByDate(orders, this.data.filterDate)
      }
      
      // 按日期分组
      const groupedOrders = this.groupOrdersByDate(orders)
      
      this.setData({ orders, groupedOrders })
    } catch (err) {
      console.error('加载订单失败', err)
      wx.showToast({ title: '加载失败', icon: 'none' })
    }
  },

  filterOrdersByDate(orders, filterDate) {
    const [year, month, day] = filterDate.split('-').map(Number)
    return orders.filter(order => {
      const date = new Date(order.createTime)
      return date.getFullYear() === year &&
             date.getMonth() + 1 === month &&
             date.getDate() === day
    })
  },

  groupOrdersByDate(orders) {
    const groups = {}
    const today = this.data.today
    const yesterday = this.data.yesterday
    
    orders.forEach(order => {
      const dateStr = this.formatDate(new Date(order.createTime))
      if (!groups[dateStr]) {
        let dateText = dateStr
        if (dateStr === today) {
          dateText = '今天'
        } else if (dateStr === yesterday) {
          dateText = '昨天'
        }
        groups[dateStr] = {
          date: dateStr,
          dateText,
          orders: []
        }
      }
      groups[dateStr].orders.push(order)
    })
    
    // 按日期降序排列
    return Object.keys(groups).map(key => groups[key]).sort((a, b) => b.date.localeCompare(a.date))
  },

  // ==================== 日期筛选 ====================

  onDateChange(e) {
    this.setData({ filterDate: e.detail.value })
    this.loadOrders()
  },

  setToday() {
    this.setData({ filterDate: this.data.today })
    this.loadOrders()
  },

  setYesterday() {
    this.setData({ filterDate: this.data.yesterday })
    this.loadOrders()
  },

  clearDateFilter() {
    this.setData({ filterDate: '' })
    this.loadOrders()
  },

  async loadDishes() {
    try {
      let dishes = await api.getDishes(this.data.dishStatus)
      const categoryMap = {}
      this.data.categories.forEach(c => { categoryMap[c._id] = c.name })
      dishes = dishes.map(d => ({
        ...d,
        categoryName: categoryMap[d.categoryId] || '未分类'
      }))
      this.setData({ dishes })
    } catch (err) {
      console.error('加载菜品失败', err)
      wx.showToast({ title: '加载失败', icon: 'none' })
    }
  },

  async loadTables() {
    try {
      let tables = await api.getTables(this.data.tableStatus)
      
      // 计算统计数据
      const allTables = await api.getTables('all')
      const stats = {
        total: allTables.length,
        idle: allTables.filter(t => t.status === 0).length,
        occupied: allTables.filter(t => t.status === 1).length
      }
      
      this.setData({ tables, tableStats: stats })
    } catch (err) {
      console.error('加载桌号失败', err)
      wx.showToast({ title: '加载失败', icon: 'none' })
    }
  },

  // ==================== 订单操作 ====================

  goToOrderDetail(e) {
    const order = e.detail?.order || e.currentTarget.dataset?.order
    if (!order || !order._id) {
      wx.showToast({ title: '订单数据异常', icon: 'none' })
      return
    }
    wx.navigateTo({ url: `/packageOrder/orderDetail/orderDetail?id=${order._id}` })
  },

  async handleOrderCancel(e) {
    const { order } = e.detail
    const res = await wx.showModal({
      title: '提示',
      content: '确定要取消这个订单吗？'
    })
    
    if (res.confirm) {
      wx.showLoading({ title: '处理中...' })
      try {
        await api.cancelOrder(order._id)
        wx.hideLoading()
        wx.showToast({ title: '订单已取消', icon: 'success' })
        this.refreshData()
      } catch (err) {
        wx.hideLoading()
        wx.showToast({ title: '取消失败', icon: 'none' })
      }
    }
  },

  async handleOrderAccept(e) {
    await this.updateOrderStatusWithConfirm(e.detail.order._id, 2, '接单')
  },

  async handleOrderServe(e) {
    await this.updateOrderStatusWithConfirm(e.detail.order._id, 3, '出餐')
  },

  async handleOrderComplete(e) {
    await this.updateOrderStatusWithConfirm(e.detail.order._id, 4, '完成')
  },

  async handleOrderRefund(e) {
    const { order } = e.detail

    // 弹出退款确认框
    wx.showModal({
      title: '确认退款',
      content: `确定要退款吗？订单金额：¥${order.totalPrice}`,
      editable: true,
      placeholderText: '请输入退款原因（可选）',
      success: async (res) => {
        if (res.confirm) {
          wx.showLoading({ title: '处理中...' })
          try {
            const refundReason = res.content || '商家退款'
            const result = await api.refundOrder(order._id, refundReason)

            wx.hideLoading()

            if (result.success) {
              wx.showToast({
                title: `已退款 ¥${result.data.refundAmount}`,
                icon: 'success'
              })
              this.refreshData()
            } else {
              wx.showToast({
                title: result.message || '退款失败',
                icon: 'none'
              })
            }
          } catch (err) {
            wx.hideLoading()
            console.error('退款失败', err)
            wx.showToast({ title: '退款失败', icon: 'none' })
          }
        }
      }
    })
  },

  async handleOrderDelete(e) {
    const { order } = e.detail

    const res = await wx.showModal({
      title: '确认删除',
      content: `确定要删除订单 ${order.orderNo || ''} 吗？删除后无法恢复！`,
      confirmColor: '#ff4d4f'
    })

    if (res.confirm) {
      wx.showLoading({ title: '删除中...' })
      try {
        const result = await wx.cloud.callFunction({
          name: 'order',
          data: { action: 'delete', orderId: order._id }
        })

        wx.hideLoading()

        if (result.result.success) {
          wx.showToast({ title: '删除成功', icon: 'success' })
          this.refreshData()
        } else {
          wx.showToast({ title: result.result.message || '删除失败', icon: 'none' })
        }
      } catch (err) {
        wx.hideLoading()
        console.error('删除订单失败', err)
        wx.showToast({ title: '删除失败', icon: 'none' })
      }
    }
  },

  async updateOrderStatusWithConfirm(orderId, status, actionName) {
    const res = await wx.showModal({
      title: '确认操作',
      content: `确定${actionName}吗？`
    })
    
    if (res.confirm) {
      wx.showLoading({ title: '处理中...' })
      try {
        const result = await api.updateOrderStatus(orderId, status)
        wx.hideLoading()
        
        if (result && result.success) {
          wx.showToast({ title: '操作成功', icon: 'success' })
          this.refreshData()
        } else {
          console.error('更新订单状态失败', result)
          wx.showToast({ 
            title: result?.message || '操作失败', 
            icon: 'none',
            duration: 2000
          })
        }
      } catch (err) {
        wx.hideLoading()
        console.error('更新订单状态异常', err)
        wx.showToast({ 
          title: err.message || '操作失败', 
          icon: 'none',
          duration: 2000
        })
      }
    }
  },

  // ==================== 菜品操作 ====================

  showAddDishModal() {
    this.setData({ showDishModal: true, editingDish: null })
  },

  showEditDishModal(e) {
    const { dish } = e.detail
    this.setData({ showDishModal: true, editingDish: dish })
  },

  hideDishModal() {
    this.setData({ showDishModal: false, editingDish: null })
  },

  async handleDishSubmit(e) {
    const { isEdit, dishId, dishData } = e.detail
    
    wx.showLoading({ title: isEdit ? '更新中...' : '创建中...' })
    try {
      if (isEdit) {
        await api.updateDish(dishId, dishData)
      } else {
        await api.createDish(dishData)
      }
      wx.hideLoading()
      wx.showToast({ title: isEdit ? '更新成功' : '创建成功', icon: 'success' })
      this.hideDishModal()
      this.refreshData()
    } catch (err) {
      wx.hideLoading()
      wx.showToast({ title: isEdit ? '更新失败' : '创建失败', icon: 'none' })
    }
  },

  async handleDishToggle(e) {
    const { dish } = e.detail
    const newStatus = dish.status === 1 ? 0 : 1
    const actionText = newStatus === 1 ? '上架' : '下架'
    
    const res = await wx.showModal({
      title: '确认操作',
      content: `确定${actionText}该菜品吗？`
    })
    
    if (res.confirm) {
      wx.showLoading({ title: '处理中...' })
      try {
        await api.toggleDishStatus(dish._id, newStatus)
        wx.hideLoading()
        wx.showToast({ title: `${actionText}成功`, icon: 'success' })
        this.refreshData()
      } catch (err) {
        wx.hideLoading()
        wx.showToast({ title: '操作失败', icon: 'none' })
      }
    }
  },

  async handleDishDelete(e) {
    const { dish } = e.detail
    
    const res = await wx.showModal({
      title: '确认删除',
      content: '删除后无法恢复，确定要删除该菜品吗？'
    })
    
    if (res.confirm) {
      wx.showLoading({ title: '删除中...' })
      try {
        await api.deleteDish(dish._id)
        wx.hideLoading()
        wx.showToast({ title: '删除成功', icon: 'success' })
        this.refreshData()
      } catch (err) {
        wx.hideLoading()
        wx.showToast({ title: '删除失败', icon: 'none' })
      }
    }
  },

  // ==================== 桌号操作 ====================

  showAddTableModal() {
    this.setData({ showTableModal: true, editingTable: null })
  },

  showEditTableModal(e) {
    const { table } = e.detail
    this.setData({ showTableModal: true, editingTable: table })
  },

  hideTableModal() {
    this.setData({ showTableModal: false, editingTable: null })
  },

  async handleTableSubmit(e) {
    const { isEdit, tableId, tableData } = e.detail
    
    wx.showLoading({ title: isEdit ? '更新中...' : '创建中...' })
    try {
      if (isEdit) {
        await api.updateTable(tableId, tableData)
      } else {
        await api.createTable(tableData)
      }
      wx.hideLoading()
      wx.showToast({ title: isEdit ? '更新成功' : '创建成功', icon: 'success' })
      this.hideTableModal()
      this.refreshData()
    } catch (err) {
      wx.hideLoading()
      wx.showToast({ title: isEdit ? '更新失败' : '创建失败', icon: 'none' })
    }
  },

  async handleTableToggle(e) {
    const { table } = e.detail
    const newStatus = table.status === 1 ? 0 : 1
    const actionText = newStatus === 1 ? '设为使用中' : '设为空闲'
    
    const res = await wx.showModal({
      title: '确认操作',
      content: `确定${actionText}吗？`
    })
    
    if (res.confirm) {
      wx.showLoading({ title: '处理中...' })
      try {
        await api.toggleTableStatus(table._id, newStatus)
        wx.hideLoading()
        wx.showToast({ title: '操作成功', icon: 'success' })
        this.refreshData()
      } catch (err) {
        wx.hideLoading()
        wx.showToast({ title: '操作失败', icon: 'none' })
      }
    }
  },

  async handleTableDelete(e) {
    const { table } = e.detail
    
    const res = await wx.showModal({
      title: '确认删除',
      content: '删除后无法恢复，确定要删除该桌号吗？'
    })
    
    if (res.confirm) {
      wx.showLoading({ title: '删除中...' })
      try {
        await api.deleteTable(table._id)
        wx.hideLoading()
        wx.showToast({ title: '删除成功', icon: 'success' })
        this.refreshData()
      } catch (err) {
        wx.hideLoading()
        wx.showToast({ title: '删除失败', icon: 'none' })
      }
    }
  },

  // ==================== 桌号二维码操作 ====================

  async handleTableGenerateQR(e) {
    const { table } = e.detail

    wx.showLoading({ title: '生成中...' })
    try {
      const res = await wx.cloud.callFunction({
        name: 'table',
        data: { action: 'generateQR', tableNumber: table.tableNumber }
      })

      wx.hideLoading()
      if (res.result.success) {
        wx.showToast({ title: '生成成功', icon: 'success' })
        this.refreshData()
      } else {
        wx.showToast({ title: res.result.message || '生成失败', icon: 'none' })
      }
    } catch (err) {
      wx.hideLoading()
      console.error('生成二维码失败', err)
      wx.showToast({ title: '生成失败', icon: 'none' })
    }
  },

  async handleTableDownloadQR(e) {
    const { table } = e.detail
    const url = table.qrCode

    if (!url) {
      wx.showToast({ title: '请先生成二维码', icon: 'none' })
      return
    }

    wx.showLoading({ title: '下载中...' })
    try {
      const res = await wx.downloadFile({ url })
      await wx.saveImageToPhotosAlbum({ filePath: res.tempFilePath })
      wx.hideLoading()
      wx.showToast({ title: '已保存到相册', icon: 'success' })
    } catch (err) {
      wx.hideLoading()
      if (err.errMsg && err.errMsg.includes('auth deny')) {
        wx.showModal({
          title: '提示',
          content: '需要您授权保存图片到相册',
          showCancel: false
        })
      } else {
        wx.showToast({ title: '保存失败', icon: 'none' })
      }
    }
  },

  async handleBatchGenerateQR() {
    const res = await wx.showModal({
      title: '确认',
      content: '确定要为所有桌号生成二维码吗？'
    })

    if (res.confirm) {
      this.setData({ generating: true })
      try {
        const res = await wx.cloud.callFunction({ name: 'table', data: { action: 'batchGenerateQR' } })

        if (res.result.success) {
          wx.showToast({
            title: `成功生成${res.result.successCount}个二维码`,
            icon: 'success',
            duration: 2000
          })
          this.refreshData()
        } else {
          wx.showToast({ title: '批量生成失败', icon: 'none' })
        }
      } catch (err) {
        console.error('批量生成二维码失败', err)
        wx.showToast({ title: '批量生成失败', icon: 'none' })
      } finally {
        this.setData({ generating: false })
      }
    }
  },

  // ==================== 辅助方法 ====================

  async refreshData() {
    await Promise.all([
      api.getStats().then(stats => this.setData({ stats })),
      this.loadCurrentTabData()
    ])
  },

  // ==================== 自动接单 ====================

  async toggleAutoAccept(e) {
    const newValue = e.detail.value

    wx.showLoading({ title: '处理中...' })
    try {
      const res = await api.toggleAutoAccept()
      wx.hideLoading()

      if (res.success) {
        this.setData({
          'shopInfo.autoAcceptOrder': newValue
        })
        wx.showToast({
          title: res.message || (newValue ? '已开启自动接单' : '已关闭自动接单'),
          icon: 'success'
        })
      } else {
        wx.showToast({ title: res.message || '操作失败', icon: 'none' })
      }
    } catch (err) {
      wx.hideLoading()
      console.error('切换自动接单失败', err)
      wx.showToast({ title: '操作失败', icon: 'none' })
    }
  },

  goToCustomerMode() {
    wx.switchTab({ url: '/pages/index/index' })
  },

  handleLogout() {
    wx.showModal({
      title: '提示',
      content: '确定退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          wx.removeStorageSync('userInfo')
          wx.redirectTo({ url: '/pages/login/login' })
        }
      }
    })
  },

  // ==================== 打印机相关 ====================

  checkPrinterStatus() {
    const connected = printService.isConnected()
    this.setData({ printerConnected: connected })
  },

  goToPrinterSetting() {
    wx.navigateTo({ url: '/packageMerchant/printerSetting/printerSetting' })
  },

  // 打印订单
  async printOrder(order) {
    const autoPrint = printService.getAutoPrint()
    if (!autoPrint) return

    try {
      const result = await printService.printOrder(order, this.data.shopInfo)
      if (!result.success) {
        console.error('打印失败', result.message)
      }
    } catch (err) {
      console.error('打印订单失败', err)
    }
  },

  // 打印后厨单
  async printKitchenTicket(order) {
    const printKitchen = wx.getStorageSync('printKitchen') !== false
    if (!printKitchen) return

    try {
      await printService.printKitchenTicket(order)
    } catch (err) {
      console.error('打印后厨单失败', err)
    }
  },

  // 接单时自动打印
  async acceptAndPrint(order) {
    await this.updateOrderStatusWithConfirm(order._id, 2, '接单')
    
    // 打印后厨单
    await this.printKitchenTicket(order)
  }
})