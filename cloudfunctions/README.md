# 云函数说明文档

## 用户相关

### login - 用户登录
- **功能**: 用户登录/注册
- **输入**: userInfo (用户信息)
- **输出**: openid, sessionKey

---

## 订单相关

### createOrder - 创建订单
- **功能**: 创建新订单
- **输入**: tableNumber, items, totalPrice, remark, deliveryMode, addressId
- **输出**: orderId, orderNo

### createPayment - 创建支付
- **功能**: 创建微信支付订单
- **输入**: orderId
- **输出**: payment (支付参数)

### paymentCallback - 支付回调
- **功能**: 处理微信支付回调
- **触发方式**: 微信支付服务器回调

### cancelOrder - 取消订单
- **功能**: 取消订单
- **输入**: orderId
- **输出**: success

### cancelTimeoutOrders - 取消超时订单
- **功能**: 取消超时未支付的订单
- **输入**: 无
- **输出**: cancelledCount
- **触发方式**: 定时触发器

### getUserOrders - 获取用户订单
- **功能**: 获取当前用户的订单列表
- **输入**: status (可选), page, pageSize
- **输出**: orders, total

### getOrderDetail - 获取订单详情
- **功能**: 获取订单详细信息
- **输入**: orderId
- **输出**: order

### updateOrderStatus - 更新订单状态
- **功能**: 更新订单状态
- **输入**: orderId, status
- **输出**: success, message

---

## 商家相关

### getMerchantOrders - 获取商家订单
- **功能**: 获取商家所有订单
- **输入**: status (可选), page, pageSize
- **输出**: orders, total

### merchantStats - 商家统计数据
- **功能**: 获取商家统计数据
- **输入**: 无
- **输出**: todayOrders, todayRevenue, pendingOrders

### addMerchantWhitelist - 添加商家白名单
- **功能**: 添加商家用户到白名单
- **输入**: openid
- **输出**: success

---

## 菜品管理

### manageDish - 菜品管理
- **功能**: 菜品增删改查
- **输入**: action (add/update/delete/get), dishData
- **输出**: success, dish/dishes

---

## 桌号管理

### getTables - 获取桌号列表
- **功能**: 获取可用桌号列表
- **输入**: status (默认1)
- **输出**: tables

### manageTable - 桌号管理
- **功能**: 桌号增删改查
- **输入**: action (add/update/delete/get), tableData
- **输出**: success, table/tables

### generateTableQRCode - 生成桌号二维码
- **功能**: 为指定桌号生成小程序码
- **输入**: tableNumber
- **输出**: success, fileID, downloadURL

### batchGenerateTableQRCode - 批量生成桌号二维码
- **功能**: 为所有桌号批量生成小程序码
- **输入**: 无
- **输出**: success, results, total, successCount

---

## 地址管理

### getAddresses - 获取地址列表
- **功能**: 获取用户所有收货地址
- **输入**: 无
- **输出**: success, addresses

### addAddress - 添加地址
- **功能**: 添加用户收货地址
- **输入**: name, phone, province, city, district, detail, isDefault
- **输出**: success, addressId

### updateAddress - 更新地址
- **功能**: 更新用户收货地址
- **输入**: addressId, name, phone, province, city, district, detail, isDefault
- **输出**: success

### deleteAddress - 删除地址
- **功能**: 删除用户收货地址
- **输入**: addressId
- **输出**: success

### setDefaultAddress - 设置默认地址
- **功能**: 设置默认收货地址
- **输入**: addressId
- **输出**: success

---

## 店铺管理

### manageShop - 店铺信息管理
- **功能**: 店铺信息增删改查
- **输入**: action (get/update), shopData
- **输出**: success, shopInfo

---

## 数据库初始化

### initDatabase - 初始化数据库
- **功能**: 初始化数据库数据和集合
- **输入**: 无
- **输出**: success

---

## 订单状态说明

| 状态码 | 状态 | 说明 |
|-------|------|------|
| 0 | 待支付 | 订单已创建，等待支付 |
| 1 | 待接单 | 支付成功，等待商户接单 |
| 2 | 制作中 | 商户已接单，正在制作 |
| 3 | 已出餐 | 制作完成，等待取餐 |
| 4 | 已完成 | 订单已完成 |
| 5 | 已取消 | 订单已取消 |

---

## 部署说明

所有云函数都需要上传到微信云开发环境后才能使用。

部署步骤：
1. 右键点击云函数文件夹
2. 选择"上传并部署：云端安装依赖"
3. 等待部署完成
4. 在云开发控制台查看部署状态

---

## 定时触发器配置

### cancelTimeoutOrders
建议配置定时触发器，每 5 分钟执行一次：
```
Cron 表达式: */5 * * * *
```

---

## 注意事项

1. 所有云函数都包含错误处理
2. 返回格式统一为 `{ success: boolean, message?: string, ...data }`
3. 数据库操作都使用 try-catch 包裹
4. 使用 cloud.DYNAMIC_CURRENT_ENV 自动适配环境