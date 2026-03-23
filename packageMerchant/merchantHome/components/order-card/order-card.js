Component({
  properties: {
    order: {
      type: Object,
      value: {}
    }
  },

  methods: {
    onTap() {
      if (this.properties.order && this.properties.order._id) {
        this.triggerEvent('tap', { order: this.properties.order })
      } else {
        console.warn('order-card: order data is missing or invalid')
      }
    },

    stopPropagation() {},

    onCancel() {
      this.triggerEvent('cancel', { order: this.properties.order })
    },

    onAccept() {
      this.triggerEvent('accept', { order: this.properties.order })
    },

    onComplete() {
      this.triggerEvent('complete', { order: this.properties.order })
    },

    onRefund() {
      this.triggerEvent('refund', { order: this.properties.order })
    },

    onDelete() {
      console.log('onDelete, order:', this.properties.order)
      this.triggerEvent('delete', { order: this.properties.order })
    }
  }
})