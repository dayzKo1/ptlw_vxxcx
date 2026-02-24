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
  orderNo: "订单号",
  tableNumber: "桌号",
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
  status: 0,
  transactionId: "微信支付交易号",
  payTime: 1234567890000,
  createTime: 1234567890000,
  updateTime: 1234567890000
}
```

订单状态说明：
- 0: 待支付
- 1: 制作中
- 2: 已出餐
- 3: 已完成
- 4: 已取消

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
  createTime: 1234567890000,
  updateTime: 1234567890000
}
```