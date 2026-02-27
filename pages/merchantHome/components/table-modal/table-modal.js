Component({
  properties: {
    show: {
      type: Boolean,
      value: false
    },
    table: {
      type: Object,
      value: null
    }
  },

  data: {
    isEdit: false,
    formData: {
      tableNumber: '',
      qrCode: ''
    }
  },

  observers: {
    'show, table': function(show, table) {
      if (show) {
        if (table) {
          this.setData({
            isEdit: true,
            formData: {
              tableNumber: table.tableNumber || '',
              qrCode: table.qrCode || ''
            }
          })
        } else {
          this.setData({
            isEdit: false,
            formData: {
              tableNumber: '',
              qrCode: ''
            }
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

    onSubmit() {
      const { formData, isEdit } = this.data
      
      if (!formData.tableNumber) {
        wx.showToast({ title: '请填写桌号', icon: 'none' })
        return
      }

      this.triggerEvent('submit', {
        isEdit,
        tableId: isEdit ? this.properties.table._id : null,
        tableData: {
          tableNumber: formData.tableNumber,
          qrCode: formData.qrCode
        }
      })
    }
  }
})