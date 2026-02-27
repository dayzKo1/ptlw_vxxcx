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
  orderNo: "订单号",           // 新规则：T桌号-序号 / P序号 / D序号
  orderType: "T/P/D",          // 订单类型：T=桌号, P=自取, D=外卖
  orderTypeText: "桌号订单",    // 订单类型描述
  sequence: 1,                 // 当日序号
  tableNumber: "桌号",         // 桌号订单时有值
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
  addressId: "配送地址ID",
  status: 0,
  transactionId: "微信支付交易号",
  payTime: 1234567890000,
  autoAccepted: false,         // 是否自动接单
  createTime: 1234567890000,
  updateTime: 1234567890000
}
```

订单状态说明：
- 0: 待支付
- 1: 待接单（支付成功后等待商户接单）
- 2: 制作中（已接单）
- 3: 已出餐
- 4: 已完成
- 5: 已取消

订单号规则：
- 桌号订单：`T桌号-序号`，如 `T05-001`（5号桌当日第1单）
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
  autoAcceptOrder: false,      // 是否自动接单
  createTime: 1234567890000,
  updateTime: 1234567890000
}
```

## 6. orderCounters（订单计数器集合）

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
- 桌号订单：`table_YYYYMMDD_桌号`
- 自取订单：`pickup_YYYYMMDD`
- 外卖订单：`delivery_YYYYMMDD`