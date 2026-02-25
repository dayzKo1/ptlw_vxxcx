# 云函数说明文档

## 已有云函数

### 1. login - 用户登录
- **功能**: 用户登录/注册
- **输入**: userInfo (用户信息)
- **输出**: openid, sessionKey
- **使用页面**: login.js

### 2. createOrder - 创建订单
- **功能**: 创建新订单
- **输入**: tableNumber, items, totalPrice, remark
- **输出**: orderId, orderNo
- **使用页面**: cart.js

### 3. createPayment - 创建支付
- **功能**: 创建微信支付订单
- **输入**: orderId
- **输出**: payment (支付参数)
- **使用页面**: order.js, orderDetail.js

### 4. paymentCallback - 支付回调
- **功能**: 处理微信支付回调
- **输入**: returnCode, returnMsg, transactionId, outTradeNo, timeEnd, totalFee
- **输出**: errcode, errmsg
- **触发方式**: 微信支付服务器回调

### 5. cancelOrder - 取消订单
- **功能**: 取消订单
- **输入**: orderId
- **输出**: success
- **使用页面**: order.js, orderDetail.js

### 6. initDatabase - 初始化数据库
- **功能**: 初始化数据库数据
- **输入**: 无
- **输出**: success
- **使用方式**: 手动调用一次

---

## 新增云函数

### 7. updateOrderStatus - 更新订单状态
- **功能**: 更新订单状态（待支付/制作中/已出餐/已完成/已取消）
- **输入**: orderId, status
- **输出**: success, message
- **使用场景**: 商家端更新订单状态

### 8. getDishes - 获取菜品列表
- **功能**: 获取菜品列表，支持分类筛选
- **输入**: categoryId (可选), status (默认1)
- **输出**: dishes
- **使用页面**: menu.js, category.js

### 9. getCategories - 获取分类列表
- **功能**: 获取菜品分类列表
- **输入**: status (默认1)
- **输出**: categories
- **使用页面**: menu.js, category.js

### 10. getTables - 获取桌号列表
- **功能**: 获取可用桌号列表
- **输入**: status (默认1)
- **输出**: tables
- **使用页面**: index.js

### 11. addFavorite - 添加收藏
- **功能**: 添加菜品到收藏
- **输入**: dishId
- **输出**: success, isFavorite, message
- **使用页面**: dishDetail.js

### 12. removeFavorite - 取消收藏
- **功能**: 取消菜品收藏
- **输入**: dishId
- **输出**: success, isFavorite, message
- **使用页面**: dishDetail.js

### 13. getFavorites - 获取收藏列表
- **功能**: 获取用户收藏列表
- **输入**: page (默认1), pageSize (默认20)
- **输出**: favorites, total, page, pageSize
- **使用页面**: mine.js (我的页面)

### 14. completeOrder - 订单出餐
- **功能**: 商家确认订单已出餐
- **输入**: orderId
- **输出**: success, message
- **使用场景**: 商家端操作

### 15. updateOrderRemark - 更新订单备注
- **功能**: 更新订单备注信息
- **输入**: orderId, remark
- **输出**: success, message
- **使用场景**: 商家端操作

### 16. addAddress - 添加收货地址
- **功能**: 添加用户收货地址
- **输入**: name, phone, province, city, district, detail, isDefault (可选)
- **输出**: success, addressId, message
- **使用页面**: mine.js (我的页面)

### 17. deleteAddress - 删除收货地址
- **功能**: 删除用户收货地址
- **输入**: addressId
- **输出**: success, message
- **使用页面**: mine.js (我的页面)

### 18. updateAddress - 更新收货地址
- **功能**: 更新用户收货地址
- **输入**: addressId, name, phone, province, city, district, detail, isDefault (可选)
- **输出**: success, message
- **使用页面**: mine.js (我的页面)

### 19. getAddresses - 获取收货地址列表
- **功能**: 获取用户所有收货地址
- **输入**: 无
- **输出**: success, addresses
- **使用页面**: mine.js (我的页面), cart.js (购物车页面)

### 20. setDefaultAddress - 设置默认地址
- **功能**: 设置默认收货地址
- **输入**: addressId
- **输出**: success, message
- **使用页面**: mine.js (我的页面)

---

## 订单状态说明

- **0**: 待支付
- **1**: 制作中
- **2**: 已出餐
- **3**: 已完成
- **4**: 已取消

---

## 部署说明

所有云函数都需要上传到微信云开发环境后才能使用。

部署步骤：
1. 右键点击云函数文件夹
2. 选择"上传并部署：云端安装依赖"
3. 等待部署完成
4. 在云开发控制台查看部署状态

---

## 注意事项

1. 所有云函数都包含错误处理
2. 返回格式统一为 { success: boolean, message?: string, ...data }
3. 数据库操作都使用 try-catch 包裹
4. 使用 cloud.DYNAMIC_CURRENT_ENV 自动适配环境
