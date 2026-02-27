const app = getApp()

Page({
  data: {
    categories: [],
    dishes: [],
    currentCategoryId: '',
    currentTab: 'all',
    loading: false,
    showAddModal: false,
    showEditModal: false,
    editingDish: null,
    formData: {
      name: '',
      price: '',
      description: '',
      categoryId: '',
      image: '',
      spicyLevel: 0,
      isHot: false,
      isNew: false,
      sort: 0
    },
    spicyOptions: ['不辣', '微辣', '中辣', '特辣', '变态辣'],
    categoryPickerIndex: 0,
    categoryPickerName: '请选择分类'
  },

  onLoad() {
    this.checkMerchantRole()
    this.loadCategories()
  },

  onShow() {
    this.loadDishes()
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
        success: function() {
          wx.switchTab({ url: '/pages/index/index' })
        }
      })
    }
  },

  loadCategories: function() {
    const self = this
    const db = wx.cloud.database()
    db.collection('categories').where({ status: 1 }).orderBy('sort', 'asc').get({
      success: function(res) {
        const defaultCategoryId = res.data.length > 0 ? res.data[0]._id : ''
        self.setData({
          categories: res.data,
          currentCategoryId: '',
          'formData.categoryId': defaultCategoryId,
          categoryPickerIndex: res.data.length > 0 ? 0 : -1,
          categoryPickerName: res.data.length > 0 ? res.data[0].name : '请选择分类'
        })
      },
      fail: function(err) {
        console.error('加载分类失败', err)
        self.setData({
          categories: [
            { _id: '1', name: '热菜' },
            { _id: '2', name: '凉菜' },
            { _id: '3', name: '主食' }
          ],
          'formData.categoryId': '1',
          categoryPickerIndex: 0,
          categoryPickerName: '热菜'
        })
      }
    })
  },

  loadDishes: function() {
    const self = this
    this.setData({ loading: true })
    
    wx.cloud.callFunction({
      name: 'manageDish',
      data: {
        action: 'getList',
        categoryId: this.data.currentCategoryId || undefined
      },
      success: function(res) {
        let dishes = res.result.data || []
        
        if (self.data.currentTab === 'online') {
          dishes = dishes.filter(function(d) { return d.status === 1 })
        } else if (self.data.currentTab === 'offline') {
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

        self.setData({ dishes: dishes, loading: false })
      },
      fail: function(err) {
        console.error('加载菜品失败', err)
        self.setData({ loading: false })
        wx.showToast({ title: '加载失败', icon: 'none' })
      }
    })
  },

  switchTab: function(e) {
    const tab = e.currentTarget.dataset.tab
    this.setData({ currentTab: tab })
    this.loadDishes()
  },

  selectCategory: function(e) {
    const id = e.currentTarget.dataset.id
    this.setData({ currentCategoryId: id === this.data.currentCategoryId ? '' : id })
    this.loadDishes()
  },

  showAddModal: function() {
    const defaultCategoryId = this.data.categories.length > 0 ? this.data.categories[0]._id : ''
    const defaultIndex = this.data.categories.length > 0 ? 0 : -1
    this.setData({
      showAddModal: true,
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

  hideAddModal: function() {
    this.setData({ showAddModal: false })
  },

  showEditModal: function(e) {
    const dish = e.currentTarget.dataset.dish
    const self = this
    const categoryIndex = this.data.categories.findIndex(function(c) {
      return c._id === dish.categoryId
    })
    const categoryName = categoryIndex >= 0 ? this.data.categories[categoryIndex].name : '请选择分类'
    this.setData({
      showEditModal: true,
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

  hideEditModal: function() {
    this.setData({ showEditModal: false, editingDish: null })
  },

  hideModals: function() {
    this.setData({
      showAddModal: false,
      showEditModal: false,
      editingDish: null
    })
  },

  submitForm: function() {
    if (this.data.showAddModal) {
      this.createDish()
    } else {
      this.updateDish()
    }
  },

  onInputChange: function(e) {
    const field = e.currentTarget.dataset.field
    const obj = {}
    obj['formData.' + field] = e.detail.value
    this.setData(obj)
  },

  onSwitchChange: function(e) {
    const field = e.currentTarget.dataset.field
    const obj = {}
    obj['formData.' + field] = e.detail.value
    this.setData(obj)
  },

  onCategoryChange: function(e) {
    const index = e.detail.value
    this.setData({
      'formData.categoryId': this.data.categories[index]._id,
      categoryPickerIndex: index,
      categoryPickerName: this.data.categories[index].name
    })
  },

  onSpicyChange: function(e) {
    this.setData({
      'formData.spicyLevel': parseInt(e.detail.value)
    })
  },

  chooseImage: function() {
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
          fail: function(err) {
            wx.hideLoading()
            console.error('上传图片失败', err)
            wx.showToast({ title: '上传失败', icon: 'none' })
          }
        })
      }
    })
  },

  createDish: function() {
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
        self.hideAddModal()
        self.loadDishes()
      },
      fail: function(err) {
        wx.hideLoading()
        console.error('创建菜品失败', err)
        wx.showToast({ title: '创建失败', icon: 'none' })
      }
    })
  },

  updateDish: function() {
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
        self.hideEditModal()
        self.loadDishes()
      },
      fail: function(err) {
        wx.hideLoading()
        console.error('更新菜品失败', err)
        wx.showToast({ title: '更新失败', icon: 'none' })
      }
    })
  },

  toggleStatus: function(e) {
    const self = this
    const id = e.currentTarget.dataset.id
    const status = e.currentTarget.dataset.status
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
            },
            fail: function(err) {
              wx.hideLoading()
              console.error('更新状态失败', err)
              wx.showToast({ title: '操作失败', icon: 'none' })
            }
          })
        }
      }
    })
  },

  deleteDish: function(e) {
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
            },
            fail: function(err) {
              wx.hideLoading()
              console.error('删除菜品失败', err)
              wx.showToast({ title: '删除失败', icon: 'none' })
            }
          })
        }
      }
    })
  },

  goToOrder: function() {
    wx.navigateTo({ url: '/pages/merchantOrder/merchantOrder' })
  },

  onPullDownRefresh: function() {
    this.loadDishes()
    wx.stopPullDownRefresh()
  }
})