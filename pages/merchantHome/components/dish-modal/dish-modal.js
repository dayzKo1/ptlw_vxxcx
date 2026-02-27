const api = require('../../../../utils/merchant-api.js')

Component({
  properties: {
    show: {
      type: Boolean,
      value: false
    },
    dish: {
      type: Object,
      value: null
    },
    categories: {
      type: Array,
      value: []
    }
  },

  data: {
    isEdit: false,
    formData: {
      name: '',
      price: '',
      description: '',
      categoryId: '',
      image: '',
      spicyLevel: 0,
      sort: 0,
      isHot: false,
      isNew: false
    },
    categoryIndex: 0,
    spicyOptions: api.SPICY_OPTIONS
  },

  observers: {
    'show, dish': function(show, dish) {
      if (show) {
        if (dish) {
          const categoryIndex = this.data.categories.findIndex(c => c._id === dish.categoryId)
          this.setData({
            isEdit: true,
            formData: {
              name: dish.name || '',
              price: dish.price ? String(dish.price) : '',
              description: dish.description || '',
              categoryId: dish.categoryId || '',
              image: dish.image || '',
              spicyLevel: dish.spicyLevel || 0,
              sort: dish.sort || 0,
              isHot: dish.isHot || false,
              isNew: dish.isNew || false
            },
            categoryIndex: categoryIndex >= 0 ? categoryIndex : 0
          })
        } else {
          const defaultCategoryId = this.data.categories.length > 0 ? this.data.categories[0]._id : ''
          this.setData({
            isEdit: false,
            formData: {
              name: '',
              price: '',
              description: '',
              categoryId: defaultCategoryId,
              image: '',
              spicyLevel: 0,
              sort: 0,
              isHot: false,
              isNew: false
            },
            categoryIndex: 0
          })
        }
      }
    }
  },

  methods: {
    onClose() {
      this.triggerEvent('close')
    },

    onInput(e) {
      const field = e.currentTarget.dataset.field
      this.setData({
        [`formData.${field}`]: e.detail.value
      })
    },

    onSwitch(e) {
      const field = e.currentTarget.dataset.field
      this.setData({
        [`formData.${field}`]: e.detail.value
      })
    },

    onCategoryChange(e) {
      const index = parseInt(e.detail.value)
      this.setData({
        categoryIndex: index,
        'formData.categoryId': this.data.categories[index]._id
      })
    },

    onSpicyChange(e) {
      this.setData({
        'formData.spicyLevel': parseInt(e.detail.value)
      })
    },

    onChooseImage() {
      wx.chooseImage({
        count: 1,
        sizeType: ['compressed'],
        sourceType: ['album', 'camera'],
        success: async (res) => {
          const tempFilePath = res.tempFilePaths[0]
          wx.showLoading({ title: '上传中...' })
          try {
            const fileID = await api.uploadImage(tempFilePath)
            this.setData({ 'formData.image': fileID })
            wx.hideLoading()
          } catch (err) {
            wx.hideLoading()
            wx.showToast({ title: '上传失败', icon: 'none' })
          }
        }
      })
    },

    onSubmit() {
      const { formData, isEdit } = this.data
      
      if (!formData.name || !formData.price) {
        wx.showToast({ title: '请填写必填项', icon: 'none' })
        return
      }

      const dishData = {
        name: formData.name,
        price: parseFloat(formData.price),
        description: formData.description,
        categoryId: formData.categoryId,
        image: formData.image,
        spicyLevel: formData.spicyLevel,
        sort: formData.sort,
        isHot: formData.isHot,
        isNew: formData.isNew
      }

      this.triggerEvent('submit', {
        isEdit,
        dishId: isEdit ? this.properties.dish._id : null,
        dishData
      })
    }
  }
})