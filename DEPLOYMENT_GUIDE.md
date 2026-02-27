# 点餐小程序部署指南

## 部署前检查清单

### 1. 基础配置

#### 1.1 小程序 AppID
- [ ] 登录微信公众平台 (https://mp.weixin.qq.com)
- [ ] 在"开发" -> "开发设置"中查看 AppID
- [ ] 修改 `project.config.json` 中的 `appid` 字段

#### 1.2 云开发环境 ID
- [ ] 在微信开发者工具中点击"云开发"
- [ ] 创建云开发环境（如未创建）
- [ ] 复制环境 ID
- [ ] 修改 `cloudbaserc.json` 中的 `envId` 字段

### 2. 支付配置

#### 2.1 微信支付商户号
- [ ] 登录微信支付商户平台 (https://pay.weixin.qq.com)
- [ ] 查看商户号
- [ ] 编辑 `cloudfunctions/createPayment/index.js`
- [ ] 将 `MCH_ID` 替换为你的商户号

#### 2.2 支付回调配置
- [ ] 确保 `paymentCallback` 云函数已上传并部署
- [ ] 在微信支付商户平台配置支付回调（如需要）

### 3. 云函数部署

#### 3.1 上传云函数
在微信开发者工具中，右键点击每个云函数目录，选择"上传并部署：云端安装依赖"

需要部署的云函数：
- [ ] `login` - 用户登录
- [ ] `createOrder` - 创建订单
- [ ] `createPayment` - 创建支付
- [ ] `paymentCallback` - 支付回调
- [ ] `cancelOrder` - 取消订单
- [ ] `updateOrderStatus` - 更新订单状态（含订阅消息通知）
- [ ] `manageDish` - 菜品管理
- [ ] `getAddresses` - 获取地址列表
- [ ] `addAddress` - 添加地址
- [ ] `updateAddress` - 更新地址
- [ ] `deleteAddress` - 删除地址
- [ ] `setDefaultAddress` - 设置默认地址
- [ ] `getTables` - 获取桌号列表
- [ ] `generateTableQRCode` - 生成桌号二维码
- [ ] `batchGenerateTableQRCode` - 批量生成桌号二维码
- [ ] `addMerchantWhitelist` - 添加商户白名单
- [ ] `merchantStats` - 商户统计
- [ ] `cancelTimeoutOrders` - 取消超时订单（定时任务）

#### 3.2 验证云函数
- [ ] 在云开发控制台 -> 云函数中查看所有云函数状态是否为"部署成功"
- [ ] 测试 `login` 云函数是否能正常返回用户信息

### 4. 数据库初始化

#### 4.1 初始化数据库
- [ ] 上传并部署 `initDatabase` 云函数（如存在）
- [ ] 或在云开发控制台手动创建以下集合：
  - [ ] `categories` - 菜品分类
  - [ ] `dishes` - 菜品
  - [ ] `orders` - 订单
  - [ ] `tables` - 桌号
  - [ ] `shopInfo` - 店铺信息
  - [ ] `addresses` - 用户地址
  - [ ] `merchantWhitelist` - 商户白名单

#### 4.2 添加初始数据
- [ ] 在 `shopInfo` 集合中添加店铺信息：
  ```json
  {
    "name": "你的店铺名称",
    "logo": "店铺 Logo 图片 URL",
    "address": "店铺地址",
    "phone": "联系电话",
    "businessHours": "09:00-22:00",
    "description": "店铺描述"
  }
  ```

- [ ] 在 `categories` 集合中添加菜品分类
- [ ] 在 `dishes` 集合中添加菜品数据

#### 4.3 设置商户白名单
- [ ] 在 `merchantWhitelist` 集合中添加商户 OpenID：
  ```json
  {
    "openid": "商户的 OpenID",
    "nickName": "商户昵称",
    "status": 1
  }
  ```

### 5. 桌号二维码生成

#### 5.1 添加桌号
- [ ] 在商户后台添加桌号信息
- [ ] 或使用云开发控制台在 `tables` 集合中添加：
  ```json
  {
    "tableNumber": "1",
    "status": 1
  }
  ```

#### 5.2 生成二维码
- [ ] 在商户后台使用"批量生成二维码"功能
- [ ] 或调用 `batchGenerateTableQRCode` 云函数
- [ ] 下载并打印二维码图片

### 6. 订阅消息配置（可选）

#### 6.1 创建消息模板
- [ ] 登录微信公众平台
- [ ] 在"功能" -> "订阅消息"中添加模板
- [ ] 推荐模板格式：
  - 订单状态通知：
    - 订单状态 (thing1)
    - 订单编号 (thing2)
    - 桌号/配送类型 (thing3)
    - 更新时间 (time4)

#### 6.2 配置模板 ID
- [ ] 编辑 `cloudfunctions/updateOrderStatus/index.js`
- [ ] 将 `YOUR_TEMPLATE_ID` 替换为实际的模板 ID
- [ ] 取消注释订阅消息发送代码

### 7. 定时任务配置（可选）

#### 7.1 配置订单超时取消
- [ ] 在云开发控制台 -> 云函数 -> `cancelTimeoutOrders`
- [ ] 点击"触发器"标签
- [ ] 添加触发器，配置 cron 表达式：
  ```
  */5 * * * *  # 每 5 分钟执行一次
  ```

### 8. 测试验证

#### 8.1 基础功能测试
- [ ] 用户登录
- [ ] 浏览菜品
- [ ] 加入购物车
- [ ] 提交订单
- [ ] 订单支付（测试环境）
- [ ] 订单状态更新

#### 8.2 商户端测试
- [ ] 商户后台访问
- [ ] 菜品管理（增删改查）
- [ ] 订单管理（状态更新）
- [ ] 桌号管理

#### 8.3 特殊场景测试
- [ ] 非营业时间下单（应提示）
- [ ] 订单超时未支付（应自动取消）
- [ ] 购物车为空提交（应提示）

### 9. 上线发布

#### 9.1 代码审核
- [ ] 在微信开发者工具中点击"上传"
- [ ] 填写版本号和备注
- [ ] 登录微信公众平台
- [ ] 在"版本管理"中提交审核

#### 9.2 审核注意事项
- [ ] 确保有实际的测试菜品和分类
- [ ] 支付功能可使用沙箱环境测试
- [ ] 隐私政策和服务协议（如需要）

### 10. 运营维护

#### 10.1 日常维护
- [ ] 定期备份数据库数据
- [ ] 监控云函数调用量和错误日志
- [ ] 及时更新菜品信息

#### 10.2 数据监控
- [ ] 在云开发控制台监控资源使用情况
- [ ] 关注免费额度使用量（避免超额）

---

## 常见问题

### Q1: 云函数上传失败
**A:** 检查网络连接，确保 `cloudbaserc.json` 中的 `envId` 正确

### Q2: 支付功能无法使用
**A:** 确认已配置正确的商户号，且小程序已绑定支付商户

### Q3: 订阅消息无法发送
**A:** 需要用户先订阅消息，且在微信公众平台配置正确的模板 ID

### Q4: 订单超时取消不生效
**A:** 检查 `cancelTimeoutOrders` 云函数是否部署成功，触发器是否启用

### Q5: 商户后台无法访问
**A:** 检查用户 OpenID 是否在 `merchantWhitelist` 集合中

---

## 技术支持

- 微信开放社区：https://developers.weixin.qq.com/community/
- 微信云开发文档：https://developers.weixin.qq.com/miniprogram/dev/wxcloud/basis/getting-started.html
