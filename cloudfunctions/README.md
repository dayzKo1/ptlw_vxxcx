# 云函数整合说明

## 整合前后对比

| 整合前（25个） | 整合后（8个） |
|---------------|--------------|
| login | **user** (action: login, addMerchant, checkMerchant) |
| addMerchantWhitelist | ↑ |
| createOrder | **order** (action: create, pay, payCallback, cancel, cancelTimeout, getUserList, getMerchantList, getDetail, updateStatus, refund, delete) |
| createPayment | ↑ |
| paymentCallback | ↑ |
| cancelOrder | ↑ |
| cancelTimeoutOrders | ↑ |
| getUserOrders | ↑ |
| getMerchantOrders | ↑ |
| getOrderDetail | ↑ |
| updateOrderStatus | ↑ |
| refundOrder | ↑ |
| deleteOrder | ↑ |
| manageDish | **dish** (action: list, detail, create, update, delete, toggle) |
| getTables | **table** (action: list, create, update, delete, toggle, generateQR, batchGenerateQR) |
| manageTable | ↑ |
| generateTableQRCode | ↑ |
| batchGenerateTableQRCode | ↑ |
| getAddresses | **address** (action: list, add, update, delete, setDefault) |
| addAddress | ↑ |
| updateAddress | ↑ |
| deleteAddress | ↑ |
| setDefaultAddress | ↑ |
| manageShop | **shop** (action: get, update, toggleAutoAccept) |
| merchantStats | **stats** |
| initDatabase | **initDatabase** (保持不变) |

---

## 调用方式变化

### 旧方式
```javascript
// 登录
wx.cloud.callFunction({ name: 'login', data: { userInfo } })

// 创建订单
wx.cloud.callFunction({ name: 'createOrder', data: { items, totalPrice } })

// 获取菜品列表
wx.cloud.callFunction({ name: 'manageDish', data: { action: 'getList' } })
```

### 新方式
```javascript
// 登录
wx.cloud.callFunction({ name: 'user', data: { action: 'login', userInfo } })

// 创建订单
wx.cloud.callFunction({ name: 'order', data: { action: 'create', items, totalPrice } })

// 获取菜品列表
wx.cloud.callFunction({ name: 'dish', data: { action: 'list' } })
```

---

## 新云函数 API 文档

### user（用户服务）
| action | 说明 | 参数 |
|--------|------|------|
| login | 用户登录 | userInfo |
| addMerchant | 添加商户 | openid |
| checkMerchant | 检查商户权限 | - |

### order（订单服务）
| action | 说明 | 参数 |
|--------|------|------|
| create | 创建订单 | tableNumber, items, totalPrice, remark, deliveryMode, addressId |
| pay | 创建支付 | orderId |
| payCallback | 支付回调 | returnCode, returnMsg, transactionId, outTradeNo |
| cancel | 取消订单 | orderId, cancelReason |
| cancelTimeout | 取消超时订单 | - |
| getUserList | 获取用户订单 | status, page, pageSize |
| getMerchantList | 获取商家订单 | status, page, pageSize |
| getDetail | 获取订单详情 | orderId |
| updateStatus | 更新订单状态 | orderId, status |
| refund | 退款 | orderId, refundReason, refundAmount |
| delete | 删除订单 | orderId |

### dish（菜品服务）
| action | 说明 | 参数 |
|--------|------|------|
| list | 获取菜品列表 | categoryId, status |
| detail | 获取菜品详情 | dishId |
| create | 创建菜品 | dishData |
| update | 更新菜品 | dishId, dishData |
| delete | 删除菜品 | dishId |
| toggle | 切换菜品状态 | dishId, status |

### table（桌号服务）
| action | 说明 | 参数 |
|--------|------|------|
| list | 获取桌号列表 | status |
| create | 创建桌号 | tableData |
| update | 更新桌号 | tableId, tableData |
| delete | 删除桌号 | tableId |
| toggle | 切换桌号状态 | tableId, status |
| generateQR | 生成二维码 | tableNumber |
| batchGenerateQR | 批量生成二维码 | - |

### address（地址服务）
| action | 说明 | 参数 |
|--------|------|------|
| list | 获取地址列表 | - |
| add | 添加地址 | name, phone, province, city, district, detail, isDefault |
| update | 更新地址 | addressId, ... |
| delete | 删除地址 | addressId |
| setDefault | 设置默认地址 | addressId |

### shop（店铺服务）
| action | 说明 | 参数 |
|--------|------|------|
| get | 获取店铺信息 | - |
| update | 更新店铺信息 | shopData |
| toggleAutoAccept | 切换自动接单 | - |

### stats（统计服务）
- 无需 action 参数，直接调用返回统计数据

### initDatabase（数据库初始化）
- 保持原有调用方式

---

## 迁移步骤

1. **备份现有云函数**
   ```bash
   mv cloudfunctions cloudfunctions-old
   mv cloudfunctions-v2 cloudfunctions
   ```

2. **更新调用代码**
   - 全局搜索 `wx.cloud.callFunction`
   - 按照上述映射关系修改调用参数

3. **部署新云函数**
   - 右键 `cloudfunctions` → 上传并部署

4. **测试验证**
   - 测试所有功能确保正常

---

## 优势

| 项目 | 整合前 | 整合后 |
|------|--------|--------|
| 云函数数量 | 25个 | 8个 |
| 部署时间 | ~5分钟 | ~2分钟 |
| 冷启动开销 | 高 | 低 |
| 代码复用 | 低 | 高 |
| 维护成本 | 高 | 低 |