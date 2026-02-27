const app = getApp()
const mock = require('../../utils/mock.js')

Page({
  data: {
    currentTab: 'order',
    userInfo: null,
    stats: {
      todayOrders: 0,
      todayIncome: 0,
      pendingOrders: 0,
      cookingOrders: 0,
      dishCount: 0,
      onlineDishCount: 0,
      tableCount: 0,
      activeTableCount: 0
    },
    orders: [],
    dishes: [],
    tables: [],
    categories: [],
    orderStatus: -1,
    dishStatus: 'all',
    tableStatus: 'all',
    loading: false,
    refreshing: false,
    showDishModal: false,
    showTableModal: false,
    editingDish: null,
    editingTable: null,
    formData: {
      name: '',
      price: '',
      description: '',
      categoryId: '',
      image: '',
      spicyLevel: 0,
      isHot: false,
      isNew: false,
      sort: 0,
      tableNumber: '',
      qrCode: ''
    },
    spicyOptions: ['不辣', '微辣', '中辣', '特辣', '变态辣'],
    categoryPickerIndex: 0,
    categoryPickerName: '请选择分类'
  },

  onLoad() {
    this.checkMerchantRole()
  },

  onShow() {
    this.loadStats()
    if (this.data.currentTab === 'order') {
      this.loadOrders()
    } else if (this.data.currentTab === 'dish') {
      this.loadDishes()
    } else if (this.data.currentTab === 'table') {
      this.loadTables()
    }
    this.loadCategories()
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

  loadStats() {
    const self = this
    const db = wx.cloud.database()
    const _ = db.command
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    if (mock.isDevMode()) {
      const todayOrders = mock.orders.filter(function(o) { return o.createTime >= today.getTime() }).length
      const pendingOrders = mock.orders.filter(function(o) { return o.status === 0 }).length
      const cookingOrders = mock.orders.filter(function(o) { return o.status === 1 }).length
      const dishCount = mock.dishes.length
      const onlineDishCount = mock.dishes.filter(function(d) { return d.status === 1 }).length
      const tableCount = mock.tables.length
      const activeTableCount = mock.tables.filter(function(t) { return t.status === 1 }).length

      self.setData({
        'stats.todayOrders': todayOrders,
        'stats.pendingOrders': pendingOrders,
        'stats.cookingOrders': cookingOrders,
        'stats.dishCount': dishCount,
        'stats.onlineDishCount': onlineDishCount,
        'stats.tableCount': tableCount,
        'stats.activeTableCount': activeTableCount
      })
      return
    }
    
    db.collection('orders').where({
      createTime: _.gte(today.getTime())
    }).count({
      success: function(res) {
        self.setData({ 'stats.todayOrders': res.total })
      }
    })

    db.collection('orders').where({
      status: 1
    }).count({
      success: function(res) {
        self.setData({ 'stats.cookingOrders': res.total })
      }
    })

    db.collection('orders').where({
      status: 0
    }).count({
      success: function(res) {
        self.setData({ 'stats.pendingOrders': res.total })
      }
    })

    db.collection('dishes').count({
      success: function(res) {
        self.setData({ 'stats.dishCount': res.total })
      }
    })

    db.collection('dishes').where({
      status: 1
    }).count({
      success: function(res) {
        self.setData({ 'stats.onlineDishCount': res.total })
      }
    })

    db.collection('tables').count({
      success: function(res) {
        self.setData({ 'stats.tableCount': res.total })
      }
    })

    db.collection('tables').where({
      status: 1
    }).count({
      success: function(res) {
        self.setData({ 'stats.activeTableCount': res.total })
      }
    })
  },

  loadCategories() {
    const self = this

    if (mock.isDevMode()) {
      const defaultCategoryId = mock.categories.length > 0 ? mock.categories[0]._id : ''
      self.setData({
        categories: mock.categories,
        'formData.categoryId': defaultCategoryId
      })
      return
    }
    
    const db = wx.cloud.database()
    db.collection('categories').where({ status: 1 }).orderBy('sort', 'asc').get({
      success: function(res) {
        const defaultCategoryId = res.data.length > 0 ? res.data[0]._id : ''
        self.setData({
          categories: res.data,
          'formData.categoryId': defaultCategoryId
        })
      },
      fail: function() {
        self.setData({
          categories: [
            { _id: '1', name: '热菜' },
            { _id: '2', name: '凉菜' },
            { _id: '3', name: '主食' }
          ],
          'formData.categoryId': '1'
        })
      }
    })
  },

  switchTab(e) {
    const tab = e.currentTarget.dataset.tab
    this.setData({ currentTab: tab })
    if (tab === 'order') {
      this.loadOrders()
    } else if (tab === 'dish') {
      this.loadDishes()
    } else if (tab === 'table') {
      this.loadTables()
    }
  },

  loadOrders() {
    const self = this
    
    if (mock.isDevMode()) {
      let orders = mock.orders
      if (this.data.orderStatus >= 0) {
        orders = orders.filter(function(o) { return o.status === self.data.orderStatus })
      }
      
      const processedOrders = orders.map(function(order) {
        return {
          ...order,
          orderNo: order.orderNo || order._id.slice(-8),
          statusText: self.getStatusText(order.status),
          timeText: self.formatTime(order.createTime),
          itemCount: order.items ? order.items.reduce(function(sum, item) { return sum + item.quantity }, 0) : 0
        }
      })
      
      this.setData({ orders: processedOrders, loading: false, refreshing: false })
      return
    }
    
    const db = wx.cloud.database()
    const _ = db.command

    let condition = {}
    if (this.data.orderStatus >= 0) {
      condition = { status: this.data.orderStatus }
    }

    this.setData({ loading: true })
    db.collection('orders').where(condition).orderBy('createTime', 'desc').limit(50).get({
      success: function(res) {
        const orders = res.data.map(function(order) {
          return {
            ...order,
            orderNo: order.orderNo || order._id.slice(-8),
            statusText: self.getStatusText(order.status),
            timeText: self.formatTime(order.createTime),
            itemCount: order.items ? order.items.reduce(function(sum, item) { return sum + item.quantity }, 0) : 0
          }
        })
        self.setData({ orders: orders, loading: false, refreshing: false })
      },
      fail: function() {
        self.setData({ loading: false, refreshing: false })
        wx.showToast({ title: '加载失败', icon: 'none' })
      }
    })
  },

  loadDishes() {
    const self = this

    this.setData({ loading: true })

    if (mock.isDevMode()) {
      let dishes = mock.dishes

      if (self.data.dishStatus === 'online') {
        dishes = dishes.filter(function(d) { return d.status === 1 })
      } else if (self.data.dishStatus === 'offline') {
        dishes = dishes.filter(function(d) { return d.status === 0 })
      }

      const categoryMap = {}
      self.data.categories.forEach(function(c) { categoryMap[c._id] = c.name })
      dishes = dishes.map(function(d) {
        return {
          ...d,
          categoryName: categoryMap[d.categoryId] || '未分类',
          statusText: d.status === 1 ? '上架' : '下架'
        }
      })

      self.setData({ dishes: dishes, loading: false, refreshing: false })
      return
    }

    wx.cloud.callFunction({
      name: 'manageDish',
      data: { action: 'getList' },
      success: function(res) {
        let dishes = res.result.data || []

        if (self.data.dishStatus === 'online') {
          dishes = dishes.filter(function(d) { return d.status === 1 })
        } else if (self.data.dishStatus === 'offline') {
          dishes = dishes.filter(function(d) { return d.status === 0 })
        }

        const categoryMap = {}
        self.data.categories.forEach(function(c) { categoryMap[c._id] = c.name })
        dishes = dishes.map(function(d) {
          return {
            ...d,
            categoryName: categoryMap[d.categoryId] || '未分类',
            statusText: d.status === 1 ? '上架' : '下架'
          }
        })

        self.setData({ dishes: dishes, loading: false, refreshing: false })
      },
      fail: function() {
        self.setData({ loading: false, refreshing: false })
        wx.showToast({ title: '加载失败', icon: 'none' })
      }
    })
  },

  loadTables() {
    const self = this

    this.setData({ loading: true })

    if (mock.isDevMode()) {
      let tables = mock.tables

      if (self.data.tableStatus === 'occupied') {
        tables = tables.filter(function(t) { return t.status === 1 })
      } else if (self.data.tableStatus === 'idle') {
        tables = tables.filter(function(t) { return t.status === 0 })
      }

      const processedTables = tables.map(function(t) {
        return {
          ...t,
          statusText: t.status === 1 ? '使用中' : '空闲',
          timeText: t.orderTime ? self.formatTime(t.orderTime) : ''
        }
      })

      self.setData({ tables: processedTables, loading: false, refreshing: false })
      return
    }

    const db = wx.cloud.database()
    const _ = db.command

    let condition = {}
    if (self.data.tableStatus === 'occupied') {
      condition = { status: 1 }
    } else if (self.data.tableStatus === 'idle') {
      condition = { status: 0 }
    }

    db.collection('tables').where(condition).orderBy('tableNumber', 'asc').get({
      success: function(res) {
        const processedTables = res.data.map(function(t) {
          return {
            ...t,
            statusText: t.status === 1 ? '使用中' : '空闲',
            timeText: t.orderTime ? self.formatTime(t.orderTime) : ''
          }
        })
        self.setData({ tables: processedTables, loading: false, refreshing: false })
      },
      fail: function() {
        self.setData({ loading: false, refreshing: false })
        wx.showToast({ title: '加载失败', icon: 'none' })
      }
    })
  },

  getStatusText(status) {
    const map = { 0: '待支付', 1: '制作中', 2: '已出餐', 3: '已完成', 4: '已取消' }
    return map[status] || '未知'
  },

  formatTime(timestamp) {
    const date = new Date(timestamp)
    const month = date.getMonth() + 1
    const day = date.getDate()
    const hour = date.getHours().toString().padStart(2, '0')
    const minute = date.getMinutes().toString().padStart(2, '0')
    return month + '月' + day + '日 ' + hour + ':' + minute
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

  goToOrderDetail(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({ url: '/pages/orderDetail/orderDetail?id=' + id })
  },

  updateOrderStatus(e) {
    const self = this
    const { id, status } = e.currentTarget.dataset
    const statusNames = ['待支付', '制作中', '已出餐', '已完成', '已取消']
    
    wx.showModal({
      title: '确认操作',
      content: '确定将订单状态改为"' + statusNames[status] + '"吗？',
      success: function(res) {
        if (res.confirm) {
          wx.showLoading({ title: '处理中...' })
          wx.cloud.callFunction({
            name: 'updateOrderStatus',
            data: { orderId: id, status: status },
            success: function() {
              wx.hideLoading()
              wx.showToast({ title: '状态已更新', icon: 'success' })
              self.loadOrders()
              self.loadStats()
            },
            fail: function() {
              wx.hideLoading()
              wx.showToast({ title: '更新失败', icon: 'none' })
            }
          })
        }
      }
    })
  },

  cancelOrder(e) {
    const self = this
    const id = e.currentTarget.dataset.id
    wx.showModal({
      title: '提示',
      content: '确定要取消这个订单吗？',
      success: function(res) {
        if (res.confirm) {
          wx.showLoading({ title: '处理中...' })
          wx.cloud.callFunction({
            name: 'cancelOrder',
            data: { orderId: id },
            success: function() {
              wx.hideLoading()
              wx.showToast({ title: '订单已取消', icon: 'success' })
              self.loadOrders()
              self.loadStats()
            },
            fail: function() {
              wx.hideLoading()
              wx.showToast({ title: '取消失败', icon: 'none' })
            }
          })
        }
      }
    })
  },

  showAddDishModal() {
    const defaultCategoryId = this.data.categories.length > 0 ? this.data.categories[0]._id : ''
    const defaultIndex = this.data.categories.length > 0 ? 0 : -1
    this.setData({
      showDishModal: true,
      editingDish: null,
      formData: {
        name: '',
        price: '',
        description: '',
        categoryId: defaultCategoryId,
        image: '',
        spicyLevel: 0,
        isHot: false,
        isNew: false,
        sort: 0
      },
      categoryPickerIndex: defaultIndex,
      categoryPickerName: this.data.categories.length > 0 ? this.data.categories[0].name : '请选择分类'
    })
  },

  showEditDishModal(e) {
    const dish = e.currentTarget.dataset.dish
    const categoryIndex = this.data.categories.findIndex(function(c) { return c._id === dish.categoryId })
    const categoryName = categoryIndex >= 0 ? this.data.categories[categoryIndex].name : '请选择分类'
    this.setData({
      showDishModal: true,
      editingDish: dish,
      formData: {
        name: dish.name || '',
        price: dish.price ? String(dish.price) : '',
        description: dish.description || '',
        categoryId: dish.categoryId || '',
        image: dish.image || '',
        spicyLevel: dish.spicyLevel || 0,
        isHot: dish.isHot || false,
        isNew: dish.isNew || false,
        sort: dish.sort || 0
      },
      categoryPickerIndex: categoryIndex >= 0 ? categoryIndex : 0,
      categoryPickerName: categoryName
    })
  },

  hideDishModal() {
    this.setData({ showDishModal: false, editingDish: null })
  },

  onInputChange(e) {
    const field = e.currentTarget.dataset.field
    const obj = {}
    obj['formData.' + field] = e.detail.value
    this.setData(obj)
  },

  onSwitchChange(e) {
    const field = e.currentTarget.dataset.field
    const obj = {}
    obj['formData.' + field] = e.detail.value
    this.setData(obj)
  },

  onCategoryChange(e) {
    const index = e.detail.value
    this.setData({
      'formData.categoryId': this.data.categories[index]._id,
      categoryPickerIndex: index,
      categoryPickerName: this.data.categories[index].name
    })
  },

  onSpicyChange(e) {
    this.setData({ 'formData.spicyLevel': parseInt(e.detail.value) })
  },

  chooseImage() {
    const self = this
    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: function(res) {
        const tempFilePath = res.tempFilePaths[0]
        wx.showLoading({ title: '上传中...' })
        const cloudPath = 'dishes/' + Date.now() + '-' + Math.random().toString(36).substr(2, 9)
        wx.cloud.uploadFile({
          cloudPath: cloudPath,
          filePath: tempFilePath,
          success: function(uploadRes) {
            self.setData({ 'formData.image': uploadRes.fileID })
            wx.hideLoading()
          },
          fail: function() {
            wx.hideLoading()
            wx.showToast({ title: '上传失败', icon: 'none' })
          }
        })
      }
    })
  },

  submitDishForm() {
    if (this.data.editingDish) {
      this.updateDish()
    } else {
      this.createDish()
    }
  },

  createDish() {
    const self = this
    const formData = this.data.formData
    if (!formData.name || !formData.price) {
      wx.showToast({ title: '请填写必填项', icon: 'none' })
      return
    }

    wx.showLoading({ title: '创建中...' })
    wx.cloud.callFunction({
      name: 'manageDish',
      data: {
        action: 'create',
        dishData: {
          name: formData.name,
          price: parseFloat(formData.price),
          description: formData.description,
          categoryId: formData.categoryId,
          image: formData.image,
          spicyLevel: formData.spicyLevel,
          isHot: formData.isHot,
          isNew: formData.isNew,
          sort: formData.sort
        }
      },
      success: function() {
        wx.hideLoading()
        wx.showToast({ title: '创建成功', icon: 'success' })
        self.hideDishModal()
        self.loadDishes()
        self.loadStats()
      },
      fail: function() {
        wx.hideLoading()
        wx.showToast({ title: '创建失败', icon: 'none' })
      }
    })
  },

  updateDish() {
    const self = this
    const formData = this.data.formData
    const editingDish = this.data.editingDish
    if (!formData.name || !formData.price) {
      wx.showToast({ title: '请填写必填项', icon: 'none' })
      return
    }

    wx.showLoading({ title: '更新中...' })
    wx.cloud.callFunction({
      name: 'manageDish',
      data: {
        action: 'update',
        dishId: editingDish._id,
        dishData: {
          name: formData.name,
          price: parseFloat(formData.price),
          description: formData.description,
          categoryId: formData.categoryId,
          image: formData.image,
          spicyLevel: formData.spicyLevel,
          isHot: formData.isHot,
          isNew: formData.isNew,
          sort: formData.sort
        }
      },
      success: function() {
        wx.hideLoading()
        wx.showToast({ title: '更新成功', icon: 'success' })
        self.hideDishModal()
        self.loadDishes()
      },
      fail: function() {
        wx.hideLoading()
        wx.showToast({ title: '更新失败', icon: 'none' })
      }
    })
  },

  toggleDishStatus(e) {
    const self = this
    const { id, status } = e.currentTarget.dataset
    const newStatus = status === 1 ? 0 : 1
    
    wx.showModal({
      title: '确认操作',
      content: newStatus === 1 ? '确定上架该菜品吗？' : '确定下架该菜品吗？',
      success: function(res) {
        if (res.confirm) {
          wx.showLoading({ title: '处理中...' })
          wx.cloud.callFunction({
            name: 'manageDish',
            data: {
              action: 'toggleStatus',
              dishId: id,
              status: newStatus
            },
            success: function() {
              wx.hideLoading()
              wx.showToast({ title: newStatus === 1 ? '上架成功' : '下架成功', icon: 'success' })
              self.loadDishes()
              self.loadStats()
            },
            fail: function() {
              wx.hideLoading()
              wx.showToast({ title: '操作失败', icon: 'none' })
            }
          })
        }
      }
    })
  },

  deleteDish(e) {
    const self = this
    const id = e.currentTarget.dataset.id
    wx.showModal({
      title: '确认删除',
      content: '删除后无法恢复，确定要删除该菜品吗？',
      success: function(res) {
        if (res.confirm) {
          wx.showLoading({ title: '删除中...' })
          wx.cloud.callFunction({
            name: 'manageDish',
            data: { action: 'delete', dishId: id },
            success: function() {
              wx.hideLoading()
              wx.showToast({ title: '删除成功', icon: 'success' })
              self.loadDishes()
              self.loadStats()
            },
            fail: function() {
              wx.hideLoading()
              wx.showToast({ title: '删除失败', icon: 'none' })
            }
          })
        }
      }
    })
  },

  showAddTableModal() {
    this.setData({
      showTableModal: true,
      editingTable: null,
      formData: {
        tableNumber: '',
        qrCode: ''
      }
    })
  },

  showEditTableModal(e) {
    const table = e.currentTarget.dataset.table
    this.setData({
      showTableModal: true,
      editingTable: table,
      formData: {
        tableNumber: table.tableNumber || '',
        qrCode: table.qrCode || ''
      }
    })
  },

  hideTableModal() {
    this.setData({ showTableModal: false, editingTable: null })
  },

  submitTableForm() {
    if (this.data.editingTable) {
      this.updateTable()
    } else {
      this.createTable()
    }
  },

  createTable() {
    const self = this
    const formData = this.data.formData
    if (!formData.tableNumber) {
      wx.showToast({ title: '请填写桌号', icon: 'none' })
      return
    }

    wx.showLoading({ title: '创建中...' })

    if (mock.isDevMode()) {
      setTimeout(function() {
        const newTable = {
          _id: 'table_' + Date.now(),
          tableNumber: formData.tableNumber,
          qrCode: formData.qrCode,
          status: 0,
          createTime: Date.now()
        }
        mock.tables.push(newTable)
        wx.hideLoading()
        wx.showToast({ title: '创建成功', icon: 'success' })
        self.hideTableModal()
        self.loadTables()
        self.loadStats()
      }, 500)
      return
    }

    wx.cloud.callFunction({
      name: 'manageTable',
      data: {
        action: 'create',
        tableData: {
          tableNumber: formData.tableNumber,
          qrCode: formData.qrCode
        }
      },
      success: function() {
        wx.hideLoading()
        wx.showToast({ title: '创建成功', icon: 'success' })
        self.hideTableModal()
        self.loadTables()
        self.loadStats()
      },
      fail: function() {
        wx.hideLoading()
        wx.showToast({ title: '创建失败', icon: 'none' })
      }
    })
  },

  updateTable() {
    const self = this
    const formData = this.data.formData
    const editingTable = this.data.editingTable
    if (!formData.tableNumber) {
      wx.showToast({ title: '请填写桌号', icon: 'none' })
      return
    }

    wx.showLoading({ title: '更新中...' })

    if (mock.isDevMode()) {
      setTimeout(function() {
        const index = mock.tables.findIndex(function(t) { return t._id === editingTable._id })
        if (index >= 0) {
          mock.tables[index].tableNumber = formData.tableNumber
          mock.tables[index].qrCode = formData.qrCode
        }
        wx.hideLoading()
        wx.showToast({ title: '更新成功', icon: 'success' })
        self.hideTableModal()
        self.loadTables()
      }, 500)
      return
    }

    wx.cloud.callFunction({
      name: 'manageTable',
      data: {
        action: 'update',
        tableId: editingTable._id,
        tableData: {
          tableNumber: formData.tableNumber,
          qrCode: formData.qrCode
        }
      },
      success: function() {
        wx.hideLoading()
        wx.showToast({ title: '更新成功', icon: 'success' })
        self.hideTableModal()
        self.loadTables()
      },
      fail: function() {
        wx.hideLoading()
        wx.showToast({ title: '更新失败', icon: 'none' })
      }
    })
  },

  toggleTableStatus(e) {
    const self = this
    const { id, status } = e.currentTarget.dataset
    const newStatus = status === 1 ? 0 : 1

    wx.showModal({
      title: '确认操作',
      content: newStatus === 1 ? '确定将该桌台设为使用中吗？' : '确定将该桌台设为空闲吗？',
      success: function(res) {
        if (res.confirm) {
          wx.showLoading({ title: '处理中...' })

          if (mock.isDevMode()) {
            setTimeout(function() {
              const table = mock.tables.find(function(t) { return t._id === id })
              if (table) {
                table.status = newStatus
                if (newStatus === 1) {
                  table.orderTime = Date.now()
                } else {
                  table.orderTime = null
                }
              }
              wx.hideLoading()
              wx.showToast({ title: newStatus === 1 ? '已设为使用中' : '已设为空闲', icon: 'success' })
              self.loadTables()
              self.loadStats()
            }, 500)
            return
          }

          wx.cloud.callFunction({
            name: 'manageTable',
            data: {
              action: 'toggleStatus',
              tableId: id,
              status: newStatus
            },
            success: function() {
              wx.hideLoading()
              wx.showToast({ title: newStatus === 1 ? '设置成功' : '设置成功', icon: 'success' })
              self.loadTables()
              self.loadStats()
            },
            fail: function() {
              wx.hideLoading()
              wx.showToast({ title: '操作失败', icon: 'none' })
            }
          })
        }
      }
    })
  },

  deleteTable(e) {
    const self = this
    const id = e.currentTarget.dataset.id
    wx.showModal({
      title: '确认删除',
      content: '删除后无法恢复，确定要删除该桌号吗？',
      success: function(res) {
        if (res.confirm) {
          wx.showLoading({ title: '删除中...' })

          if (mock.isDevMode()) {
            setTimeout(function() {
              const index = mock.tables.findIndex(function(t) { return t._id === id })
              if (index >= 0) {
                mock.tables.splice(index, 1)
              }
              wx.hideLoading()
              wx.showToast({ title: '删除成功', icon: 'success' })
              self.loadTables()
              self.loadStats()
            }, 500)
            return
          }

          wx.cloud.callFunction({
            name: 'manageTable',
            data: { action: 'delete', tableId: id },
            success: function() {
              wx.hideLoading()
              wx.showToast({ title: '删除成功', icon: 'success' })
              self.loadTables()
              self.loadStats()
            },
            fail: function() {
              wx.hideLoading()
              wx.showToast({ title: '删除失败', icon: 'none' })
            }
          })
        }
      }
    })
  },

  goToCustomerMode() {
    wx.switchTab({ url: '/pages/index/index' })
  },

  handleLogout() {
    wx.showModal({
      title: '提示',
      content: '确定要退出登录吗？',
      success: function(res) {
        if (res.confirm) {
          wx.removeStorageSync('userInfo')
          app.globalData.userInfo = null
          wx.showToast({ title: '已退出登录', icon: 'success' })
          setTimeout(function() {
            wx.redirectTo({ url: '/pages/login/login' })
          }, 1500)
        }
      }
    })
  },

  onPullDownRefresh() {
    this.setData({ refreshing: true })
    this.loadStats()
    if (this.data.currentTab === 'order') {
      this.loadOrders()
    } else if (this.data.currentTab === 'table') {
      this.loadTables()
    } else {
      this.loadDishes()
    }
  }
})