Component({
  properties: {
    dish: {
      type: Object,
      value: {}
    }
  },

  methods: {
    onEdit() {
      this.triggerEvent('edit', { dish: this.properties.dish })
    },

    onToggleStatus() {
      this.triggerEvent('toggle', { dish: this.properties.dish })
    },

    onDelete() {
      this.triggerEvent('delete', { dish: this.properties.dish })
    }
  }
})