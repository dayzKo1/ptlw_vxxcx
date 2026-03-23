# 点餐小程序部署指南

## 快速部署（5分钟）

### 1. 导入项目

1. 打开微信开发者工具
2. 导入项目，填入 AppID
3. 点击「云开发」创建环境

### 2. 配置环境

修改 `app.js` 中的云开发环境 ID：

```javascript
wx.cloud.init({
  env: '你的云开发环境ID',
  traceUser: true,
})
```

### 3. 部署云函数

1. 右键 `cloudfunctions` 文件夹
2. 选择「同步云函数列表」
3. 等待所有云函数部署完成

### 4. 初始化数据库

在控制台执行：

```javascript
wx.cloud.callFunction({ 
  name: 'initDatabase', 
  data: { force: true, testOrders: true } 
}).then(r => console.log(r))
```

这将：
- 创建所有需要的数据库集合
- 初始化示例菜品、分类、桌号
- 创建测试订单
- 自动将当前用户添加为商户

### 5. 测试

刷新页面，进入商户后台测试各项功能。

---

## 详细部署

### 前置准备

- 个体工商户或企业营业执照
- 食品经营许可证
- 微信小程序认证（300元/年）

### 云函数列表

| 云函数 | Action | 说明 |
|--------|--------|------|
| **user** | login | 用户登录 |
| | addMerchant | 添加商户 |
| | checkMerchant | 检查商户权限 |
| **order** | create | 创建订单 |
| | pay | 创建支付 |
| | cancel | 取消订单 |
| | getUserList | 获取用户订单 |
| | getMerchantList | 获取商户订单 |
| | getDetail | 获取订单详情 |
| | updateStatus | 更新订单状态 |
| | refund | 退款 |
| | delete | 删除订单 |
| | clearAll | 清空所有订单 |
| **dish** | list | 获取菜品列表 |
| | create | 创建菜品 |
| | update | 更新菜品 |
| | delete | 删除菜品 |
| | toggle | 上下架 |
| **table** | list | 获取桌号列表 |
| | create | 创建桌号 |
| | generateQR | 生成二维码 |
| | batchGenerateQR | 批量生成二维码 |
| **address** | list/add/update/delete | 地址管理 |
| **shop** | get/update | 店铺信息管理 |
| **stats** | - | 商家统计 |
| **initDatabase** | - | 数据库初始化 |

### 数据库集合

| 集合名 | 说明 |
|--------|------|
| users | 用户信息 |
| merchantWhitelist | 商户白名单 |
| orders | 订单 |
| dishes | 菜品 |
| categories | 分类 |
| tables | 桌号 |
| shopInfo | 店铺信息 |
| banners | 轮播图 |
| orderCounters | 订单计数器 |
| addresses | 收货地址 |
| config | 系统配置 |
| refundLogs | 退款日志 |

---

## 支付配置

> 需要个体工商户或企业资质

### 1. 申请商户号

1. 访问 [微信支付商户平台](https://pay.weixin.qq.com/)
2. 申请成为商家
3. 关联小程序

### 2. 配置云支付

1. 云开发控制台 → 设置 → 全局设置
2. 配置微信支付参数

### 3. 修改云函数

修改 `cloudfunctions/order/index.js` 中的支付相关代码，替换为真实支付逻辑。

---

## 商户权限

### 自动添加

执行 `initDatabase` 时会自动将当前用户添加为商户。

### 手动添加

在云开发控制台，向 `merchantWhitelist` 集合添加记录：

```json
{
  "openid": "用户openid",
  "status": 1,
  "createTime": 1700000000000
}
```

### 获取 OpenID

在控制台执行：

```javascript
wx.cloud.callFunction({ name: 'user', data: { action: 'login', userInfo: { nickName: 'test' } } }).then(r => console.log(r.result.data.openid))
```

---

## 打印机配置

### 1. 进入设置

商户后台 → 🖨️ 打印机

### 2. 搜索打印机

1. 开启蓝牙打印机电源
2. 点击「搜索」
3. 选择打印机连接

### 3. 测试打印

点击「测试打印」验证连接

### 4. 开启自动打印

- 自动打印新订单：接单后自动打印小票
- 打印后厨单：接单后自动打印后厨单

---

## 常见问题

### Q: 登录失败

检查：
1. 云开发环境 ID 是否正确
2. 云函数是否部署成功
3. 查看控制台错误信息

### Q: 商户后台无法访问

检查：
1. 是否在 `merchantWhitelist` 中
2. 重新执行 `initDatabase`

### Q: 订单操作失败

检查：
1. 云函数是否部署
2. 订单状态是否允许该操作
3. 是否有商户权限

### Q: 打印机连接失败

检查：
1. 打印机电源是否开启
2. 手机蓝牙是否开启
3. 打印机是否被其他设备连接

---

## 技术支持

- [微信开放社区](https://developers.weixin.qq.com/community/)
- [微信云开发文档](https://developers.weixin.qq.com/miniprogram/dev/wxcloud/basis/getting-started.html)