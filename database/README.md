# 云数据库集合结构说明

## 1. categories（菜品分类集合）

```javascript
{
  _id: "分类ID",
  name: "分类名称",
  description: "分类描述",
  image: "分类图片URL",
  sort: 1,
  status: 1,
  createTime: 1234567890000,
  updateTime: 1234567890000
}
```

## 2. dishes（菜品集合）

```javascript
{
  _id: "菜品ID",
  categoryId: "所属分类ID",
  name: "菜品名称",
  description: "菜品描述",
  image: "菜品图片URL",
  images: ["图片URL1", "图片URL2"],
  price: 28.00,
  ingredients: "主要食材",
  spicyLevel: 3,
  isHot: true,
  isNew: false,
  sort: 1,
  status: 1,
  createTime: 1234567890000,
  updateTime: 1234567890000
}
```

## 3. orders（订单集合）

```javascript
{
  _id: "订单ID",
  _openid: "用户OpenID",        // 自动注入，标识订单所有者
  orderNo: "订单号",           // T桌号-序号 / P序号 / D序号
  orderType: "T/P/D",          // T=堂食, P=自取, D=外卖
  orderTypeText: "堂食",        // 订单类型描述
  sequence: 1,                 // 当日序号
  tableNumber: "桌号",         // 堂食时有值
  tableId: "桌号ID",           // 关联 tables._id
  items: [
    {
      dishId: "菜品ID",
      name: "菜品名称",
      price: 28.00,
      quantity: 2,
      image: "图片URL"
    }
  ],
  totalPrice: 56.00,
  remark: "备注信息",
  deliveryMode: "pickup/delivery",
  addressId: "配送地址ID",     // 外卖时有值
  status: 0,
  transactionId: "微信支付交易号",
  payTime: 1234567890000,
  autoAccepted: false,         // 是否自动接单
  timeoutAt: 1234567890000,    // 订单超时时间（创建时间 + 15分钟）
  // 用户信息冗余（方便商户查看）
  userNickName: "用户昵称",
  userAvatarUrl: "头像URL",
  createTime: 1234567890000,
  updateTime: 1234567890000
}
```

### 订单状态说明

| 状态码 | 状态 | 说明 |
|-------|------|------|
| 0 | 待支付 | 订单已创建，等待支付 |
| 1 | 待接单 | 支付成功，等待商户接单 |
| 2 | 制作中 | 商户已接单，正在制作 |
| 3 | 已出餐 | 制作完成，等待取餐 |
| 4 | 已完成 | 订单已完成 |
| 5 | 已取消 | 订单已取消 |
| 6 | 已退款 | 订单已退款 |

### 订单号规则

- 堂食订单：`T桌号-序号`，如 `T05-001`（5号桌当日第1单）
- 自取订单：`P序号`，如 `P001`（当日第1个自取单）
- 外卖订单：`D序号`，如 `D001`（当日第1个外卖单）

## 4. tables（桌号集合）

```javascript
{
  _id: "桌号ID",
  tableNumber: "桌号",
  capacity: 4,                 // 座位容量
  qrCode: "二维码URL",
  status: 0,                   // 0=空闲, 1=使用中
  currentOrderId: "",          // 当前订单ID（关联 orders._id）
  orderTime: 1234567890000,    // 开台时间（有订单时）
  createTime: 1234567890000,
  updateTime: 1234567890000
}
```

## 5. shopInfo（店铺信息集合）

```javascript
{
  _id: "店铺信息ID",
  name: "店铺名称",
  logo: "店铺Logo",
  address: "店铺地址",
  phone: "联系电话",
  businessHours: "营业时间",
  description: "店铺描述",
  latitude: 25.5067,
  longitude: 119.7956,
  autoAcceptOrder: false,      // 是否自动接单
  createTime: 1234567890000,
  updateTime: 1234567890000
}
```

## 6. addresses（收货地址集合）

```javascript
{
  _id: "地址ID",
  _openid: "用户OpenID",
  name: "联系人姓名",
  phone: "手机号",
  province: "省份",
  city: "城市",
  district: "区县",
  detail: "详细地址",
  isDefault: false,
  createTime: 1234567890000,
  updateTime: 1234567890000
}
```

## 7. orderCounters（订单计数器集合）

用于生成有序订单号，每个类型每天独立计数。

```javascript
{
  _id: "table_20260227_5",     // key: 类型_日期_桌号
  value: 1,                    // 当前序号
  date: "20260227",
  createTime: 1234567890000,
  updateTime: 1234567890000
}
```

计数器 key 规则：
- 堂食订单：`table_YYYYMMDD_桌号`
- 自取订单：`pickup_YYYYMMDD`
- 外卖订单：`delivery_YYYYMMDD`

## 8. merchantWhitelist（商家白名单集合）

```javascript
{
  _id: "记录ID",
  openid: "商家用户OpenID",
  nickname: "商家昵称",
  status: 1,                   // 1=启用, 0=禁用
  createTime: 1234567890000,
  updateTime: 1234567890000
}
```

## 9. config（系统配置集合）

```javascript
{
  _id: "配置ID",
  key: "配置键名",
  value: "配置值",
  createTime: 1234567890000
}
```

常用配置项：
- `database_initialized`: 标记数据库是否已初始化

## 10. users（用户集合）

```javascript
{
  _id: "用户ID",
  _openid: "用户OpenID",
  nickName: "用户昵称",
  avatarUrl: "头像URL",
  role: "customer/merchant",   // 用户角色
  createTime: 1234567890000,
  updateTime: 1234567890000
}
```

## 11. banners（轮播图集合）

```javascript
{
  _id: "轮播图ID",
  title: "标题",
  desc: "描述",
  image: "图片URL",
  sort: 1,
  status: 1,
  createTime: 1234567890000,
  updateTime: 1234567890000
}
```

## 12. refundLogs（退款日志集合）

```javascript
{
  _id: "退款日志ID",
  orderId: "订单ID",
  orderNo: "订单号",
  outRefundNo: "退款单号",
  transactionId: "微信支付交易号",
  refundId: "微信退款ID",
  totalFee: 5600,              // 订单总金额（分）
  refundFee: 5600,             // 退款金额（分）
  refundReason: "退款原因",
  status: "success/failed/mock", // 退款状态
  failReason: "失败原因",        // 失败时有值
  operator: "操作人OpenID",
  createTime: 1234567890000
}
```

---

## 数据关系图

### 用户与数据的关系

```
┌─────────────────────────────────────────────────────────────────┐
│                        用户系统                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   users (openid) ◄────────────────────────────────────────────┐│
│      │                                                         ││
│      ├── role: customer/merchant                               ││
│      ├── nickName, avatarUrl                                   ││
│      └── lastLoginTime                                         ││
│                                                                 ││
│   merchantWhitelist (openid) ◄────────────────────────────────┘│
│      │                                                          │
│      └── status: 1                                              │
│                                                                 │
│   ⚠️ 注意：                                                      │
│   - users.openid 和 merchantWhitelist.openid 应保持一致        │
│   - 商户权限以 merchantWhitelist 为准                          │
│   - 登录时会自动同步 users.role                                 │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                      用户数据（自动注入）                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   orders._openid ──────► 用户所有订单                           │
│   addresses._openid ───► 用户所有地址                           │
│                                                                 │
│   ⚠️ 注意：                                                      │
│   - _openid 由云开发自动注入，无需手动设置                       │
│   - 与 users.openid 值相同，但字段名不同                        │
│   - 查询时：users.where({ openid }) vs orders.where({ _openid })│
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 订单与桌号的关系

```
┌─────────────────────────────────────────────────────────────────┐
│                      订单生命周期                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   创建订单 (createOrder)                                        │
│      │                                                          │
│      ├── 堂食订单                                               │
│      │    └── tables.update({ status: 1, currentOrderId })     │
│      │                                                          │
│      ├── 支付成功 (paymentCallback)                             │
│      │    └── 自动接单：status: 2                               │
│      │    └── 手动接单：status: 1                               │
│      │                                                          │
│      └── 订单完成/取消/退款 (updateStatus/cancel/refund)         │
│           └── releaseTable() → tables.update({ status: 0 })    │
│                                                                 │
│   tables.currentOrderId ─────► orders._id                      │
│   orders.tableId ────────────► tables._id                      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 字段命名规范

| 集合 | 用户标识字段 | 说明 |
|------|-------------|------|
| users | `openid` | 手动设置，查询用户信息 |
| merchantWhitelist | `openid` | 手动设置，商户权限验证 |
| orders | `_openid` | 自动注入，订单所有者 |
| addresses | `_openid` | 自动注入，地址所有者 |
| refundLogs | `operator` | 手动设置，操作人 |

### 权限验证流程

```javascript
// 用户访问自己的数据
const orders = await db.collection('orders')
  .where({ _openid: wxContext.OPENID })
  .get()

// 商户访问所有订单
async function checkMerchantPermission(openid) {
  const res = await db.collection('merchantWhitelist')
    .where({ openid, status: 1 })
    .get()
  return res.data.length > 0
}
```

---

## 集合创建顺序

建议按以下顺序创建集合：

1. `categories` - 菜品分类
2. `dishes` - 菜品
3. `tables` - 桌号
4. `shopInfo` - 店铺信息
5. `banners` - 轮播图
6. `addresses` - 收货地址
7. `orderCounters` - 订单计数器
8. `merchantWhitelist` - 商家白名单
9. `orders` - 订单
10. `config` - 系统配置
11. `users` - 用户信息
12. `refundLogs` - 退款日志

---

## 索引建议

### orders 集合
- `_openid`: 用于查询用户订单
- `orderNo`: 用于订单号查询
- `status`: 用于按状态筛选订单
- `createTime`: 用于按时间排序

### addresses 集合
- `_openid`: 用于查询用户地址

### dishes 集合
- `categoryId`: 用于按分类查询菜品
- `status`: 用于筛选上架菜品

### merchantWhitelist 集合
- `_openid`: 用于验证商家权限

---

## 初始化数据

通过调用 `initDatabase` 云函数初始化示例数据，包括：
- 示例菜品分类
- 示例菜品
- 示例店铺信息
- 示例桌号