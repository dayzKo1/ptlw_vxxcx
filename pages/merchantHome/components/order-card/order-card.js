Component({
  properties: {
    order: {
      type: Object,
      value: {}
    }
  },

  methods: {
    onTap() {
      this.triggerEvent('tap', { order: this.properties.order })
    },

    stopPropagation() {},

    onCancel() {
      this.triggerEvent('cancel', { order: this.properties.order })
    },

    onAccept() {
      this.triggerEvent('accept', { order: this.properties.order })
    },

    onServe() {
      this.triggerEvent('serve', { order: this.properties.order })
    },

    onComplete() {
      this.triggerEvent('complete', { order: this.properties.order })
    }
  }
})