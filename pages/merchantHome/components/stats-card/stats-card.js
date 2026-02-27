Component({
  properties: {
    stats: {
      type: Object,
      value: {}
    }
  },

  data: {
    statsList: []
  },

  observers: {
    'stats': function(stats) {
      if (!stats) return
      
      this.setData({
        statsList: [
          { label: '今日订单', value: stats.todayOrders || 0 },
          { label: '待处理', value: stats.pendingOrders || 0 },
          { label: '制作中', value: stats.cookingOrders || 0 },
          { label: '上架菜品', value: `${stats.onlineDishCount || 0}/${stats.dishCount || 0}` }
        ]
      })
    }
  }
})