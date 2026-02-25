# 外卖功能完善说明

## ✅ 已完成的功能

### 1. 购物车页面优化

#### 新增功能
- ✅ 配送方式切换（自取/配送）
- ✅ 配送地址选择
- ✅ 配送费计算
- ✅ 商品金额和配送费分别显示
- ✅ 配送时必须选择地址的验证

#### 费用计算
- **自取**：商品金额 + 0元配送费
- **配送**：商品金额 + 5元配送费

#### UI 改进
```xml
<view class="delivery-mode-section">
  <view class="mode-title">配送方式</view>
  <view class="mode-options">
    <view class="mode-option">🏃 自取</view>
    <view class="mode-option">🛵 配送</view>
  </view>
</view>

<view class="address-section" wx:if="{{deliveryMode === 'delivery'}}">
  <view class="address-header">
    <text class="address-title">配送地址</text>
    <text class="add-address-btn">+ 添加地址</text>
  </view>
  <scroll-view scroll-x class="address-list">
    <view class="address-item">地址卡片</view>
  </scroll-view>
</view>

<view class="cart-footer">
  <view class="total-info">
    <view class="total-row">
      <text class="total-label">商品金额</text>
      <text class="total-value">¥{{goodsTotal}}</text>
    </view>
    <view class="total-row" wx:if="{{deliveryMode === 'delivery'}}">
      <text class="total-label">配送费</text>
      <text class="total-value">¥{{deliveryFee}}</text>
    </view>
    <view class="total-row total-row-main">
      <text class="total-label">合计</text>
      <text class="total-price">¥{{totalPrice}}</text>
    </view>
  </view>
</view>
```

---

### 2. 地址编辑页面

#### 页面功能
- ✅ 添加新地址
- ✅ 编辑已有地址
- ✅ 删除地址
- ✅ 设置默认地址
- ✅ 表单验证

#### 表单字段
- 联系人姓名
- 手机号（11位数字验证）
- 所在地区（省市区选择）
- 详细地址
- 设为默认地址（复选框）

#### 云函数调用
- **addAddress** - 添加新地址
- **updateAddress** - 更新已有地址
- **deleteAddress** - 删除地址
- **getAddresses** - 获取地址列表

---

### 3. 订单提交优化

#### 提交验证
```javascript
if (this.data.deliveryMode === 'delivery' && !this.data.addressId) {
  wx.showToast({
    title: '请选择配送地址',
    icon: 'none'
  })
  return
}
```

#### 订单数据
```javascript
{
  tableNumber: '桌号或0',
  items: [...],
  totalPrice: 商品金额 + 配送费,
  remark: '订单备注',
  deliveryMode: 'pickup' 或 'delivery',
  addressId: '配送地址ID（配送时）',
  status: 0,
  createTime: 时间戳
}
```

---

## 📁 新增文件

### 1. 地址编辑页面
- `/pages/addressEdit/addressEdit.json` - 页面配置
- `/pages/addressEdit/addressEdit.wxml` - 页面结构
- `/pages/addressEdit/addressEdit.js` - 页面逻辑
- `/pages/addressEdit/addressEdit.wxss` - 页面样式

### 2. 更新的文件
- `/pages/cart/cart.wxml` - 添加地址选择和费用明细
- `/pages/cart/cart.js` - 添加地址管理和费用计算
- `/pages/cart/cart.wxss` - 添加地址选择样式
- `/app.json` - 注册地址编辑页面

---

## 🎯 使用流程

### 添加配送地址
1. 进入购物车页面
2. 选择"配送"方式
3. 点击"+ 添加地址"
4. 填写地址信息
5. 点击"保存地址"

### 编辑配送地址
1. 进入购物车页面
2. 选择"配送"方式
3. 点击已有地址
4. 修改地址信息
5. 点击"保存地址"

### 提交配送订单
1. 进入购物车页面
2. 选择"配送"方式
3. 选择配送地址
4. 填写订单备注
5. 点击"提交订单"

---

## 💡 配送费规则

### 当前规则
- **自取**：免费
- **配送**：5元

### 可扩展规则
可以根据距离或订单金额调整配送费：
```javascript
function calculateDeliveryFee(distance, goodsTotal) {
  if (goodsTotal >= 100) {
    return 0
  }
  
  if (distance <= 3) {
    return 5
  } else if (distance <= 5) {
    return 8
  } else {
    return 10
  }
}
```

---

## 📊 数据结构

### 地址数据
```javascript
{
  _id: '地址ID',
  _openid: '用户openid',
  name: '张三',
  phone: '13800138000',
  province: '福建省',
  city: '福州市',
  district: '平潭县',
  detail: '君山镇北港村新门前16号',
  isDefault: true,
  createTime: 时间戳,
  updateTime: 时间戳
}
```

### 订单数据
```javascript
{
  _openid: '用户openid',
  orderNo: '订单号',
  tableNumber: '0',
  items: [...],
  totalPrice: 143.00,
  remark: '订单备注',
  deliveryMode: 'delivery',
  addressId: '地址ID',
  status: 0,
  createTime: 时间戳,
  updateTime: 时间戳
}
```

---

## 🔧 云函数使用

### 必需的云函数
1. **getAddresses** - 获取地址列表
2. **addAddress** - 添加新地址
3. **updateAddress** - 更新已有地址
4. **deleteAddress** - 删除地址
5. **createOrder** - 创建订单（已支持配送）

### 云函数参数

#### addAddress
```javascript
{
  name: '联系人',
  phone: '手机号',
  province: '省份',
  city: '城市',
  district: '区县',
  detail: '详细地址',
  isDefault: false
}
```

#### updateAddress
```javascript
{
  addressId: '地址ID',
  name: '联系人',
  phone: '手机号',
  province: '省份',
  city: '城市',
  district: '区县',
  detail: '详细地址',
  isDefault: false
}
```

#### deleteAddress
```javascript
{
  addressId: '地址ID'
}
```

---

## ✅ 总结

外卖相关功能已完善：

1. ✅ 配送方式切换（自取/配送）
2. ✅ 配送地址管理（添加/编辑/删除）
3. ✅ 配送费计算
4. ✅ 费用明细显示
5. ✅ 地址选择和验证
6. ✅ 订单提交优化

用户现在可以完整地使用外卖配送功能！
