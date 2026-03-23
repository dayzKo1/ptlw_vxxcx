function isDevMode() {
  return false
}

var mockOrders = []
var mockDishes = []
var mockTables = []
var mockCategories = []

module.exports = {
  isDevMode: isDevMode,
  orders: mockOrders,
  dishes: mockDishes,
  tables: mockTables,
  categories: mockCategories
}