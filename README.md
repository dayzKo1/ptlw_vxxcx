# 点餐小程序

基于微信云开发的餐饮点餐小程序，适用于个体工商户和小型餐饮店铺。

## 功能特性

- 扫码点餐
- 菜品浏览与搜索
- 购物车管理
- 在线支付
- 订单管理
- 桌号管理

## 技术栈

- 微信小程序原生开发
- 微信云开发
- 云数据库
- 云函数
- 云存储

## 项目结构

```
ptlw_vxxcx/
├── app.js                 # 小程序入口文件
├── app.json              # 小程序配置文件
├── app.wxss              # 全局样式文件
├── sitemap.json          # 站点地图配置
├── project.config.json    # 项目配置文件
├── pages/                # 页面目录
│   ├── index/           # 首页
│   ├── menu/            # 点餐页面
│   ├── cart/            # 购物车
│   ├── order/           # 订单列表
│   ├── orderDetail/     # 订单详情
│   ├── category/        # 分类页面
│   └── dishDetail/     # 菜品详情
├── cloudfunctions/      # 云函数目录
│   ├── createOrder/     # 创建订单
│   ├── createPayment/   # 创建支付
│   ├── cancelOrder/     # 取消订单
│   ├── paymentCallback/  # 支付回调
│   └── initDatabase/    # 初始化数据库
├── utils/              # 工具函数
│   └── util.js
├── database/           # 数据库文档
│   └── README.md
└── images/            # 图片资源目录
```

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

## 数据库集合

### categories（菜品分类）
- name: 分类名称
- description: 分类描述
- image: 分类图片
- sort: 排序
- status: 状态

### dishes（菜品）
- categoryId: 所属分类ID
- name: 菜品名称
- description: 菜品描述
- image: 菜品图片
- price: 价格
- ingredients: 主要食材
- spicyLevel: 辣度等级
- isHot: 是否热销
- isNew: 是否新品
- sort: 排序
- status: 状态

### orders（订单）
- orderNo: 订单号
- tableNumber: 桌号
- items: 订单明细
- totalPrice: 总金额
- remark: 备注
- status: 订单状态
- transactionId: 支付交易号
- payTime: 支付时间

### tables（桌号）
- tableNumber: 桌号
- qrCode: 二维码
- status: 状态

### shopInfo（店铺信息）
- name: 店铺名称
- logo: 店铺Logo
- address: 店铺地址
- phone: 联系电话
- businessHours: 营业时间
- description: 店铺描述

## 订单状态

- 0: 待支付
- 1: 制作中
- 2: 已出餐
- 3: 已完成
- 4: 已取消

## 开发指南

### 云函数开发

云函数位于 `cloudfunctions` 目录下，每个云函数包含：
- `index.js`: 云函数入口文件
- `package.json`: 依赖配置文件

部署云函数：
1. 右键点击云函数目录
2. 选择"上传并部署：云端安装依赖"

### 页面开发

页面位于 `pages` 目录下，每个页面包含：
- `.wxml`: 页面结构文件
- `.wxss`: 页面样式文件
- `.js`: 页面逻辑文件
- `.json`: 页面配置文件

### 工具函数

工具函数位于 `utils/util.js`，包含：
- formatPrice: 价格格式化
- formatTime: 时间格式化
- getStatusText: 状态文本转换
- showToast: 提示框
- showLoading: 加载框
- showModal: 模态框
- navigateTo: 页面跳转
- generateOrderNo: 生成订单号
- debounce: 防抖函数
- throttle: 节流函数

## 成本分析

| 费用项目 | 金额 | 说明 |
|---------|------|------|
| 微信小程序认证费 | 300元/年 | 必须支付 |
| 云开发资源 | 0元 | 免费额度足够使用 |
| 服务器成本 | 0元 | 无需购买服务器 |
| 开发成本 | 0元 | 使用模板开发 |
| 维护成本 | 0元 | 云开发自动维护 |
| **年度总成本** | **300元** | **仅为传统方案的1%** |

## 注意事项

1. 必须使用个体工商户或企业资质注册小程序，个人账号无法开通支付功能
2. 需要办理食品经营许可证
3. 支付功能需要配置微信支付商户号
4. 建议上线前进行充分测试
5. 定期备份数据库数据

## 常见问题

### Q: 如何获取小程序 AppID？
A: 登录微信公众平台，在"开发"->"开发设置"中查看。

### Q: 云开发免费额度够用吗？
A: 免费额度包含每月10万次云函数调用、500MB数据库存储、5GB云存储，完全满足小型店铺需求。

### Q: 如何修改店铺信息？
A: 在云数据库的 `shopInfo` 集合中修改店铺信息，或通过管理后台修改。

### Q: 如何添加菜品？
A: 在云数据库的 `dishes` 集合中添加菜品数据。

## 许可证

MIT License