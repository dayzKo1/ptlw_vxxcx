# 数据库集合说明文档

## 必需的数据库集合

### 1. users - 用户表
存储用户基本信息

**字段说明**:
- `openid` (string): 用户唯一标识
- `nickName` (string): 用户昵称
- `avatarUrl` (string): 用户头像URL
- `gender` (number): 性别 (0: 未知, 1: 男, 2: 女)
- `language` (string): 语言
- `city` (string): 城市
- `province` (string): 省份
- `country` (string): 国家
- `createTime` (number): 创建时间戳
- `updateTime` (number): 更新时间戳

**索引**:
- `openid` (唯一索引)

---

### 2. orders - 订单表
存储订单信息

**字段说明**:
- `_openid` (string): 用户openid (云开发自动添加)
- `orderNo` (string): 订单号
- `tableNumber` (string): 桌号
- `deliveryMode` (string): 配送方式 (pickup: 自取, delivery: 配送)
- `addressId` (string): 配送地址ID (配送模式时)
- `items` (array): 订单商品列表
  - `dishId` (string): 菜品ID
  - `dishName` (string): 菜品名称
  - `dishPrice` (number): 菜品单价
  - `quantity` (number): 数量
- `totalPrice` (number): 订单总价
- `remark` (string): 订单备注
- `status` (number): 订单状态
  - 0: 待支付
  - 1: 制作中
  - 2: 已出餐
  - 3: 已完成
  - 4: 已取消
- `transactionId` (string): 微信支付交易号
- `payTime` (number): 支付时间戳
- `createTime` (number): 创建时间戳
- `updateTime` (number): 更新时间戳

**索引**:
- `_openid` (普通索引)
- `orderNo` (唯一索引)
- `status` (普通索引)
- `createTime` (普通索引)

---

### 3. categories - 分类表
存储菜品分类

**字段说明**:
- `name` (string): 分类名称
- `description` (string): 分类描述
- `image` (string): 分类图片URL
- `sort` (number): 排序
- `status` (number): 状态 (0: 禁用, 1: 启用)
- `createTime` (number): 创建时间戳
- `updateTime` (number): 更新时间戳

**索引**:
- `sort` (普通索引)
- `status` (普通索引)

---

### 4. dishes - 菜品表
存储菜品信息

**字段说明**:
- `categoryId` (string): 所属分类ID
- `name` (string): 菜品名称
- `description` (string): 菜品描述
- `image` (string): 菜品图片URL
- `images` (array): 菜品图片列表
- `price` (number): 菜品价格
- `ingredients` (string): 食材
- `spicyLevel` (number): 辣度 (0-5)
- `isHot` (boolean): 是否热门
- `isNew` (boolean): 是否新品
- `sort` (number): 排序
- `status` (number): 状态 (0: 下架, 1: 上架)
- `createTime` (number): 创建时间戳
- `updateTime` (number): 更新时间戳

**索引**:
- `categoryId` (普通索引)
- `status` (普通索引)
- `sort` (普通索引)

---

### 5. tables - 桌号表
存储桌号信息

**字段说明**:
- `tableNumber` (string): 桌号
- `qrCode` (string): 二维码图片URL
- `status` (number): 状态 (0: 禁用, 1: 启用)
- `createTime` (number): 创建时间戳
- `updateTime` (number): 更新时间戳

**索引**:
- `tableNumber` (唯一索引)
- `status` (普通索引)

---

### 6. favorites - 收藏表
存储用户收藏的菜品

**字段说明**:
- `openid` (string): 用户openid
- `dishId` (string): 菜品ID
- `dishName` (string): 菜品名称
- `dishPrice` (number): 菜品价格
- `dishImage` (string): 菜品图片URL
- `createTime` (number): 创建时间戳

**索引**:
- `openid` (普通索引)
- `dishId` (普通索引)
- `openid + dishId` (唯一索引)

---

### 7. addresses - 地址表
存储用户收货地址

**字段说明**:
- `openid` (string): 用户openid
- `name` (string): 收货人姓名
- `phone` (string): 收货人电话
- `province` (string): 省份
- `city` (string): 城市
- `district` (string): 区县
- `detail` (string): 详细地址
- `isDefault` (boolean): 是否默认地址
- `createTime` (number): 创建时间戳
- `updateTime` (number): 更新时间戳

**索引**:
- `openid` (普通索引)
- `openid + isDefault` (普通索引)

---

### 8. shopInfo - 店铺信息表
存储店铺基本信息

**字段说明**:
- `name` (string): 店铺名称
- `logo` (string): 店铺Logo URL
- `address` (string): 店铺地址
- `phone` (string): 联系电话
- `businessHours` (string): 营业时间
- `description` (string): 店铺描述
- `createTime` (number): 创建时间戳
- `updateTime` (number): 更新时间戳

**注意**: 此表只应有一条记录

---

## 初始化步骤

### 方法一：使用云函数初始化

1. 在微信开发者工具中，右键点击 `cloudfunctions/initDatabase` 文件夹
2. 选择"上传并部署：云端安装依赖"
3. 部署完成后，在云开发控制台的云函数页面找到 `initDatabase`
4. 点击"测试"按钮，运行云函数
5. 等待初始化完成

### 方法二：手动创建集合

1. 进入微信云开发控制台
2. 点击"数据库"
3. 点击"添加集合"
4. 依次创建上述8个集合
5. 为每个集合添加相应的字段索引

---

## 注意事项

1. **权限设置**:
   - `users`: 仅创建者可读写
   - `orders`: 仅创建者可读写
   - `favorites`: 仅创建者可读写
   - `addresses`: 仅创建者可读写
   - `categories`: 所有用户可读，仅管理员可写
   - `dishes`: 所有用户可读，仅管理员可写
   - `tables`: 所有用户可读，仅管理员可写
   - `shopInfo`: 所有用户可读，仅管理员可写

2. **索引优化**:
   - 为频繁查询的字段添加索引
   - 为组合查询添加复合索引
   - 唯一索引确保数据唯一性

3. **数据备份**:
   - 定期备份重要数据
   - 建议使用云开发提供的备份功能

4. **数据安全**:
   - 敏感信息加密存储
   - 定期检查数据权限设置
