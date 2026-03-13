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
  _openid: "用户OpenID",
  orderNo: "订单号",           // T桌号-序号 / P序号 / D序号
  orderType: "T/P/D",          // T=堂食, P=自取, D=外卖
  orderTypeText: "堂食",        // 订单类型描述
  sequence: 1,                 // 当日序号
  tableNumber: "桌号",         // 堂食时有值
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

### 订单号规则

- 堂食订单：`T桌号-序号`，如 `T05-001`（5号桌当日第1单）
- 自取订单：`P序号`，如 `P001`（当日第1个自取单）
- 外卖订单：`D序号`，如 `D001`（当日第1个外卖单）

## 4. tables（桌号集合）

```javascript
{
  _id: "桌号ID",
  tableNumber: "桌号",
  qrCode: "二维码URL",
  status: 1,
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

---

## 集合创建顺序

建议按以下顺序创建集合：

1. `categories` - 菜品分类
2. `dishes` - 菜品
3. `tables` - 桌号
4. `shopInfo` - 店铺信息
5. `addresses` - 收货地址
6. `orderCounters` - 订单计数器
7. `merchantWhitelist` - 商家白名单
8. `orders` - 订单
9. `config` - 系统配置
10. `users` - 用户信息

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