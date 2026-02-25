# 云函数使用说明

## 📋 云函数分类

### ✅ 必需云函数（核心功能）

这些云函数是小程序核心功能必需的：

#### 用户相关（2个）
1. **login** - 用户登录/注册
2. **initDatabase** - 初始化数据库

#### 订单相关（7个）
3. **createOrder** - 创建订单
4. **createPayment** - 创建微信支付订单
5. **paymentCallback** - 处理微信支付回调
6. **cancelOrder** - 取消订单
7. **updateOrderStatus** - 更新订单状态
8. **completeOrder** - 订单出餐
9. **updateOrderRemark** - 更新订单备注（可选）

#### 菜品相关（3个）
10. **getDishes** - 获取菜品列表
11. **getCategories** - 获取分类列表
12. **getTables** - 获取桌号列表

#### 桌号二维码相关（2个）
13. **generateTableQRCode** - 生成桌号二维码
14. **batchGenerateTableQRCode** - 批量生成桌号二维码

---

### 🔵 可选云函数（扩展功能）

这些云函数可以根据需求选择使用：

#### 收藏功能（3个）
15. **addFavorite** - 添加收藏
16. **removeFavorite** - 取消收藏
17. **getFavorites** - 获取收藏列表

**使用场景**：
- 如果需要用户收藏菜品功能，保留这些云函数
- 如果不需要收藏功能，可以删除这些云函数

#### 地址管理功能（5个）
18. **addAddress** - 添加收货地址
19. **deleteAddress** - 删除收货地址
20. **updateAddress** - 更新收货地址
21. **getAddresses** - 获取收货地址列表
22. **setDefaultAddress** - 设置默认地址

**使用场景**：
- 如果需要配送地址管理功能，保留这些云函数
- 如果只需要简单的配送方式选择，可以删除这些云函数

---

## 🎯 当前小程序使用的云函数

根据代码分析，当前小程序实际使用的云函数：

### ✅ 已使用
- login
- initDatabase
- createOrder
- createPayment
- paymentCallback
- cancelOrder
- updateOrderStatus
- completeOrder
- getDishes
- getCategories
- getTables
- generateTableQRCode
- batchGenerateTableQRCode

### 🔵 未使用（可选）
- addFavorite
- removeFavorite
- getFavorites
- addAddress
- deleteAddress
- updateAddress
- getAddresses
- setDefaultAddress
- updateOrderRemark

---

## 📊 云函数统计

| 分类 | 必需 | 可选 | 总计 |
|------|-------|-------|-------|
| 用户相关 | 2 | 0 | 2 |
| 订单相关 | 7 | 1 | 8 |
| 菜品相关 | 3 | 0 | 3 |
| 桌号二维码 | 2 | 0 | 2 |
| 收藏相关 | 0 | 3 | 3 |
| 地址相关 | 0 | 5 | 5 |
| **总计** | **14** | **9** | **23** |

---

## 💡 建议

### 最小化部署（14个云函数）
如果只需要核心功能，可以只部署以下云函数：
- login
- initDatabase
- createOrder
- createPayment
- paymentCallback
- cancelOrder
- updateOrderStatus
- completeOrder
- getDishes
- getCategories
- getTables
- generateTableQRCode
- batchGenerateTableQRCode

### 完整部署（23个云函数）
如果需要所有功能，可以部署所有云函数，包括可选的收藏和地址管理功能。

---

## 📝 部署说明

### 部署必需云函数
```bash
# 在微信开发者工具中
1. 右键点击云函数文件夹
2. 选择"上传并部署：云端安装依赖"
3. 等待部署完成
```

### 删除可选云函数（如果不需要）
```bash
# 手动删除以下文件夹
- cloudfunctions/addFavorite
- cloudfunctions/removeFavorite
- cloudfunctions/getFavorites
- cloudfunctions/addAddress
- cloudfunctions/deleteAddress
- cloudfunctions/updateAddress
- cloudfunctions/getAddresses
- cloudfunctions/setDefaultAddress
- cloudfunctions/updateOrderRemark
```

---

## ✅ 总结

- **必需云函数**：14个（核心功能）
- **可选云函数**：9个（扩展功能）
- **当前已使用**：14个
- **未使用**：9个

可以根据实际需求选择部署哪些云函数，减少不必要的资源消耗。
