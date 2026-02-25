# 云函数更新说明

## 📋 云函数清单

### ✅ 已完善的云函数（22个）

#### 用户相关（2个）
1. **login** - 用户登录/注册
2. **initDatabase** - 初始化数据库

#### 订单相关（7个）
3. **createOrder** - 创建订单
   - ✅ 支持 tableNumber（桌号，无桌号时为0）
   - ✅ 支持 deliveryMode（pickup/delivery）
   - ✅ 支持 addressId（配送地址ID）
   - ✅ 支持 remark（订单备注）
   
4. **createPayment** - 创建微信支付订单
5. **paymentCallback** - 处理微信支付回调
6. **cancelOrder** - 取消订单
7. **updateOrderStatus** - 更新订单状态
8. **completeOrder** - 订单出餐
9. **updateOrderRemark** - 更新订单备注

#### 菜品相关（3个）
10. **getDishes** - 获取菜品列表
11. **getCategories** - 获取分类列表
12. **getTables** - 获取桌号列表

#### 收藏相关（3个）
13. **addFavorite** - 添加收藏
14. **removeFavorite** - 取消收藏
15. **getFavorites** - 获取收藏列表

#### 地址相关（5个）
16. **addAddress** - 添加收货地址
17. **deleteAddress** - 删除收货地址
18. **updateAddress** - 更新收货地址
19. **getAddresses** - 获取收货地址列表
20. **setDefaultAddress** - 设置默认地址

#### 桌号二维码相关（2个）
21. **generateTableQRCode** - 生成桌号二维码
22. **batchGenerateTableQRCode** - 批量生成桌号二维码

---

## 🔄 设计优化说明

### 简化前
- ❌ 复杂的桌号点餐/纯订单模式切换
- ❌ 需要在多个页面切换模式
- ❌ 用户体验不够流畅

### 简化后
- ✅ 统一规则：没有桌号时默认桌号为0
- ✅ 移除复杂的模式切换功能
- ✅ 简化用户操作流程

---

## 📝 createOrder 云函数详细说明

### 输入参数
```javascript
{
  tableNumber: '桌号，无桌号时为0',
  items: [
    {
      dishId: '菜品ID',
      name: '菜品名称',
      price: 68.00,
      quantity: 2,
      image: '菜品图片URL'
    }
  ],
  totalPrice: 136.00,
  remark: '订单备注',
  deliveryMode: 'pickup' 或 'delivery',
  addressId: '配送地址ID（配送模式时需要）'
}
```

### 输出结果
```javascript
{
  success: true,
  orderId: '订单ID',
  orderNo: '订单号'
}
```

### 订单数据结构
```javascript
{
  _openid: '用户openid',
  orderNo: '202402251234567890',
  tableNumber: '1号桌' 或 '0',
  items: [...],
  totalPrice: 136.00,
  remark: '订单备注',
  deliveryMode: 'pickup',
  addressId: '',
  status: 0,
  createTime: 1708838400000,
  updateTime: 1708838400000
}
```

---

## 🎯 使用规则

### 桌号规则
- **有桌号**：显示实际桌号（如：1号桌、2号桌...）
- **无桌号**：显示默认桌号0
- **扫码获取**：通过二维码扫码获取桌号

### 配送方式
- **自取**：deliveryMode = 'pickup'
- **配送**：deliveryMode = 'delivery'

### 订单类型
- **店内用餐**：有桌号（1、2、3...）
- **外卖/自提**：无桌号（默认为0）

---

## 📦 前端调用示例

### 创建订单
```javascript
const orderData = {
  tableNumber: this.data.tableNumber || '0',
  items: this.data.cartItems.map(item => ({
    dishId: item._id,
    name: item.name,
    price: item.price,
    quantity: item.quantity,
    image: item.image
  })),
  totalPrice: parseFloat(this.data.totalPrice),
  remark: this.data.remark,
  deliveryMode: this.data.deliveryMode,
  addressId: this.data.addressId || '',
  status: 0,
  createTime: new Date().getTime()
}

const res = await wx.cloud.callFunction({
  name: 'createOrder',
  data: orderData
})
```

### 获取桌号
```javascript
const tableNumber = wx.getStorageSync('tableNumber') || ''
```

### 扫码获取桌号
```javascript
// app.js
loadTableNumber(options) {
  let tableNumber = null
  
  if (options && options.query && options.query.table) {
    tableNumber = options.query.table
  } else if (options && options.scene) {
    const scene = decodeURIComponent(options.scene)
    const tableMatch = scene.match(/table=(\d+)/)
    if (tableMatch) {
      tableNumber = tableMatch[1]
    }
  }
  
  if (tableNumber) {
    wx.setStorageSync('tableNumber', tableNumber)
    this.globalData.tableNumber = tableNumber
  }
}
```

---

## ⚠️ 注意事项

1. **桌号处理**
   - 扫码获取的桌号会保存到本地存储
   - 无桌号时默认使用0
   - 订单提交时自动使用桌号或0

2. **配送方式**
   - 自取：deliveryMode = 'pickup'
   - 配送：deliveryMode = 'delivery'
   - 配送时需要提供地址ID

3. **订单状态**
   - 0: 待支付
   - 1: 制作中
   - 2: 已出餐
   - 3: 已完成
   - 4: 已取消

4. **支付配置**
   - createPayment 云函数中的 subMchId 需要替换为实际商户号
   - 确保云开发环境已配置支付功能

---

## 🚀 部署步骤

1. 上传所有云函数到云开发环境
2. 在云开发控制台配置支付功能
3. 替换 createPayment 中的商户号
4. 测试订单创建和支付流程

---

## 📊 云函数统计

| 分类 | 数量 | 状态 |
|------|-------|------|
| 用户相关 | 2 | ✅ 已完善 |
| 订单相关 | 7 | ✅ 已完善 |
| 菜品相关 | 3 | ✅ 已完善 |
| 收藏相关 | 3 | ✅ 已完善 |
| 地址相关 | 5 | ✅ 已完善 |
| 桌号二维码 | 2 | ✅ 已完善 |
| **总计** | **22** | ✅ 全部完善 |

---

## ✅ 总结

所有相关云函数都已完善并适配简化后的设计：
- ✅ 统一规则：没有桌号时默认桌号为0
- ✅ 支持自取/配送模式
- ✅ 支持配送地址管理
- ✅ 支持桌号二维码生成
- ✅ 完整的订单流程支持

设计已简化，用户体验更加流畅！
