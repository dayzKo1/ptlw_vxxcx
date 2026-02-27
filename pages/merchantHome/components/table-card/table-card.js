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

    onShowQR() {
      this.triggerEvent('showqr', { table: this.properties.table })
    }
  }
})