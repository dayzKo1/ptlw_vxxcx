# 点餐小程序

基于微信云开发的餐饮点餐小程序，适用于个体工商户和小型餐饮店铺。

## 功能特性

### 用户端
- 扫码点餐 - 扫描桌号二维码自动获取桌号
- 菜品浏览与搜索 - 分类浏览、热门推荐、新品推荐
- 购物车管理 - 添加/删除商品、数量调整
- 在线支付 - 微信支付集成
- 订单管理 - 订单列表、订单详情、状态跟踪
- 外卖配送 - 配送方式切换、地址管理、配送费计算

### 商家端
- 商家管理首页 - 订单统计、今日数据
- 菜品管理 - 分类管理、菜品上下架
- 订单管理 - 接单/拒单、状态更新
- 桌号管理 - 二维码生成与批量生成
- 自动接单 - 可配置自动接单模式
- 蓝牙打印 - 连接蓝牙打印机自动打印小票
- 订单通知 - 新订单震动提醒

## 技术栈

- 微信小程序原生开发
- 微信云开发
- 云数据库
- 云函数
- 云存储
- 分包加载

## 项目结构

```
ptlw_vxxcx/
├── app.js                 # 小程序入口文件
├── app.json              # 小程序配置文件
├── app.wxss              # 全局样式文件
├── sitemap.json          # 站点地图配置
├── project.config.json    # 项目配置文件
├── pages/                # 主包页面
│   ├── index/           # 首页
│   ├── login/           # 登录页
│   ├── menu/            # 点餐页面
│   ├── mine/            # 个人中心
│   └── order/           # 订单列表
├── packageOrder/         # 订单分包
│   ├── cart/            # 购物车
│   └── orderDetail/     # 订单详情
├── packageMerchant/      # 商家分包
│   ├── merchantHome/    # 商家首页
│   ├── category/        # 分类管理
│   ├── dishDetail/      # 菜品详情
│   ├── tableQRCode/     # 桌号二维码
│   └── printerSetting/  # 打印机设置
├── packageUser/          # 用户分包
│   ├── addressEdit/     # 地址编辑
│   ├── addressList/     # 地址列表
│   ├── about/           # 关于页面
│   └── settings/        # 设置页面
├── cloudfunctions/      # 云函数目录
├── utils/              # 工具函数
│   ├── util.js         # 通用工具
│   ├── mock.js         # 模拟数据
│   ├── merchant-api.js # 商家 API 封装
│   ├── bluetooth-printer.js    # 蓝牙打印机
│   ├── print-template.js       # 打印模板
│   ├── print-service.js        # 打印服务
│   └── order-notification.js   # 订单通知
├── database/           # 数据库文档
└── images/            # 图片资源目录
    └── banner/        # 轮播图
```

## 云函数列表

### 用户相关
- `login` - 用户登录

### 订单相关
- `createOrder` - 创建订单
- `createPayment` - 创建支付
- `paymentCallback` - 支付回调
- `cancelOrder` - 取消订单
- `cancelTimeoutOrders` - 取消超时订单
- `getUserOrders` - 获取用户订单
- `getOrderDetail` - 获取订单详情
- `updateOrderStatus` - 更新订单状态

### 商家相关
- `getMerchantOrders` - 获取商家订单
- `getOrderDetail` - 获取订单详情
- `merchantStats` - 商家统计数据
- `addMerchantWhitelist` - 添加商家白名单

### 菜品管理
- `manageDish` - 菜品管理（增删改查）

### 桌号管理
- `getTables` - 获取桌号列表
- `manageTable` - 桌号管理
- `generateTableQRCode` - 生成桌号二维码
- `batchGenerateTableQRCode` - 批量生成二维码

### 地址管理
- `getAddresses` - 获取地址列表
- `addAddress` - 添加地址
- `updateAddress` - 更新地址
- `deleteAddress` - 删除地址
- `setDefaultAddress` - 设置默认地址

### 店铺管理
- `manageShop` - 店铺信息管理

### 数据库
- `initDatabase` - 初始化数据库

## 数据库集合

| 集合名 | 说明 |
|-------|------|
| categories | 菜品分类 |
| dishes | 菜品 |
| orders | 订单 |
| tables | 桌号 |
| shopInfo | 店铺信息 |
| addresses | 收货地址 |
| orderCounters | 订单计数器 |
| merchantWhitelist | 商家白名单 |

## 订单状态

| 状态码 | 状态 | 说明 |
|-------|------|------|
| 0 | 待支付 | 订单已创建，等待支付 |
| 1 | 待接单 | 支付成功，等待商户接单 |
| 2 | 制作中 | 商户已接单，正在制作 |
| 3 | 已出餐 | 制作完成，等待取餐 |
| 4 | 已完成 | 订单已完成 |
| 5 | 已取消 | 订单已取消 |

## 订单号规则

- 桌号订单：`T桌号-序号`，如 `T05-001`（5号桌当日第1单）
- 自取订单：`P序号`，如 `P001`（当日第1个自取单）
- 外卖订单：`D序号`，如 `D001`（当日第1个外卖单）

## 快速开始

### 1. 环境准备

- 下载并安装 [微信开发者工具](https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html)
- 注册微信小程序账号（需个体工商户或企业资质）
- 完成小程序认证（300元/年）

### 2. 项目配置

1. 打开微信开发者工具
2. 导入项目，选择项目目录
3. 在 `project.config.json` 中填入你的 `appid`
4. 开启云开发功能

### 3. 云开发初始化

1. 在微信开发者工具中点击"云开发"
2. 创建云开发环境
3. 在云函数目录右键，上传并部署所有云函数
4. 调用 `initDatabase` 云函数初始化数据库

### 4. 支付配置

1. 在云开发控制台配置微信支付
2. 修改 `createPayment` 云函数中的商户号
3. 配置支付回调函数

## 商家入口

商家可通过"我的"页面进入商家管理后台，需要先在 `merchantWhitelist` 集合中添加用户 openid。

## 成本分析

| 费用项目 | 金额 | 说明 |
|---------|------|------|
| 微信小程序认证费 | 300元/年 | 必须支付 |
| 云开发资源 | 0元 | 免费额度足够使用 |
| 服务器成本 | 0元 | 无需购买服务器 |
| **年度总成本** | **300元** | **仅为传统方案的1%** |

## 注意事项

1. 必须使用个体工商户或企业资质注册小程序，个人账号无法开通支付功能
2. 需要办理食品经营许可证
3. 支付功能需要配置微信支付商户号
4. 建议上线前进行充分测试
5. 定期备份数据库数据

## 许可证

MIT License