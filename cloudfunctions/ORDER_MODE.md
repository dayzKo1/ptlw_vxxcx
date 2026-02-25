# 订单模式切换功能说明

## 功能概述

支持两种订单模式的切换：
1. **桌号点餐模式**：顾客通过扫码获取桌号，在店内用餐
2. **纯订单模式**：顾客无需桌号，直接下单（外卖/自提）

---

## 模式说明

### 桌号点餐模式

**适用场景**：
- 顾客在店内用餐
- 通过扫描桌号二维码获取桌号
- 订单关联到具体桌号

**特点**：
- 需要扫描桌号二维码
- 桌号显示在首页和购物车
- 订单创建时自动关联桌号

**流程**：
1. 顾客扫描桌号二维码
2. 自动获取桌号信息
3. 选择菜品下单
4. 订单关联到对应桌号

---

### 纯订单模式

**适用场景**：
- 外卖订单
- 自提订单
- 不需要桌号的订单

**特点**：
- 无需扫描桌号
- 桌号显示为"外卖订单"
- 可以选择自取或配送

**流程**：
1. 切换到纯订单模式
2. 选择菜品下单
3. 订单桌号为"外卖订单"
4. 可选择自取或配送方式

---

## 使用方法

### 在首页切换模式

1. 打开小程序首页
2. 点击模式切换按钮
3. 选择"桌号点餐"或"纯订单"
4. 模式切换后自动保存

### 在菜单页面切换模式

1. 打开菜单页面
2. 点击顶部模式切换按钮
3. 选择"桌号点餐"或"纯订单"
4. 模式切换后自动保存

---

## 功能差异

| 功能 | 桌号点餐模式 | 纯订单模式 |
|------|-------------|-----------|
| 需要扫码 | ✅ 是 | ❌ 否 |
| 桌号显示 | 显示具体桌号 | 显示"外卖订单" |
| 配送方式 | 自取/配送 | 自取/配送 |
| 适用场景 | 店内用餐 | 外卖/自提 |

---

## 技术实现

### 全局状态管理

在 `app.js` 中管理订单模式：

```javascript
globalData: {
  orderMode: 'table'
}

setOrderMode(mode) {
  this.globalData.orderMode = mode
  wx.setStorageSync('orderMode', mode)
}

getOrderMode() {
  return this.globalData.orderMode || wx.getStorageSync('orderMode') || 'table'
}
```

### 页面使用

在页面中加载和切换模式：

```javascript
onLoad() {
  this.loadOrderMode()
}

loadOrderMode() {
  const app = getApp()
  const orderMode = app.getOrderMode()
  this.setData({ orderMode })
}

switchOrderMode(e) {
  const mode = e.currentTarget.dataset.mode
  const app = getApp()
  app.setOrderMode(mode)
  this.setData({ orderMode: mode })
}
```

### 订单提交

根据模式设置桌号：

```javascript
const orderData = {
  items: [...],
  totalPrice: ...
}

if (orderMode === 'table') {
  orderData.tableNumber = tableNumber
} else {
  orderData.tableNumber = '外卖订单'
}
```

---

## 注意事项

1. **模式持久化**：模式选择会保存到本地存储，下次打开小程序时自动加载

2. **桌号要求**：
   - 桌号点餐模式必须先扫码获取桌号
   - 纯订单模式无需桌号

3. **配送方式**：
   - 桌号点餐模式可以选择自取或配送
   - 纯订单模式可以选择自取或配送

4. **订单标识**：
   - 桌号点餐模式订单显示具体桌号
   - 纯订单模式订单显示"外卖订单"

---

## 相关文件

- `app.js` - 全局模式管理
- `pages/index/index.js` - 首页模式切换
- `pages/menu/menu.js` - 菜单页面模式切换
- `pages/cart/cart.js` - 购物车模式适配
