Component({
  properties: {
    table: {
      type: Object,
      value: {}
    }
  },

  methods: {
    onEdit() {
      this.triggerEvent('edit', { table: this.properties.table })
    },

    onToggleStatus() {
      this.triggerEvent('toggle', { table: this.properties.table })
    },

    onDelete() {
      this.triggerEvent('delete', { table: this.properties.table })
    },

    onGenerateQR() {
      this.triggerEvent('generateqr', { table: this.properties.table })
    },

    onPreviewQR(e) {
      const url = e.currentTarget.dataset.url
      if (url) {
        wx.previewImage({
          urls: [url],
          current: url
        })
      }
    },

    onDownloadQR() {
      this.triggerEvent('downloadqr', { table: this.properties.table })
    }
  }
})