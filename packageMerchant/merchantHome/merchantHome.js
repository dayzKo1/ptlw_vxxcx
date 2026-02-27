const app = getApp()
const api = require('../../utils/merchant-api.js')

Page({
  data: {
    currentTab: 'order',
    userInfo: null,
    stats: {},
    orders: [],
    dishes: [],
    tables: [],
    categories: [],
    
    // 筛选状态
    orderStatus: -1,
    dishStatus: 'all',
    tableStatus: 'all',
    
    // 状态配置
    orderStatusList: [
      { value: -1, label: '全部' },
      { value: 0, label: '待支付' },
      { value: 1, label: '制作中' },
      { value: 2, label: '已出餐' },
      { value: 3, label: '已完成' }
    ],
    
    // UI状态
    loading: false,
    refreshing: false,
    showDishModal: false,
    showTableModal: false,
    editingDish: null,
    editingTable: null
  },

  onLoad() {
    this.checkMerchantRole()
  },

  onShow() {
    this.initData()
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
      const [stats, categories] = await Promise.all([
        api.getStats(),
        api.getCategories()
      ])
      
      this.setData({ stats, categories })
      
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

  // ==================== 数据加载 ====================

  async loadOrders() {
    try {
      const orders = await api.getOrders(this.data.orderStatus)
      this.setData({ orders })
    } catch (err) {
      console.error('加载订单失败', err)
      wx.showToast({ title: '加载失败', icon: 'none' })
    }
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
      const tables = await api.getTables(this.data.tableStatus)
      this.setData({ tables })
    } catch (err) {
      console.error('加载桌号失败', err)
      wx.showToast({ title: '加载失败', icon: 'none' })
    }
  },

  // ==================== 订单操作 ====================

  goToOrderDetail(e) {
    const { order } = e.detail
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
    await this.updateOrderStatusWithConfirm(e.detail.order._id, 1, '接单')
  },

  async handleOrderServe(e) {
    await this.updateOrderStatusWithConfirm(e.detail.order._id, 2, '出餐')
  },

  async handleOrderComplete(e) {
    await this.updateOrderStatusWithConfirm(e.detail.order._id, 3, '完成')
  },

  async updateOrderStatusWithConfirm(orderId, status, actionName) {
    const res = await wx.showModal({
      title: '确认操作',
      content: `确定${actionName}吗？`
    })
    
    if (res.confirm) {
      wx.showLoading({ title: '处理中...' })
      try {
        await api.updateOrderStatus(orderId, status)
        wx.hideLoading()
        wx.showToast({ title: '操作成功', icon: 'success' })
        this.refreshData()
      } catch (err) {
        wx.hideLoading()
        wx.showToast({ title: '操作失败', icon: 'none' })
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

  // ==================== 辅助方法 ====================

  async refreshData() {
    await Promise.all([
      api.getStats().then(stats => this.setData({ stats })),
      this.loadCurrentTabData()
    ])
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
  }
})