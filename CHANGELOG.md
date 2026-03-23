# 更新日志

## 2026-03-23

### 新增功能
- ✅ 全局缓存机制，分类和菜品数据缓存 5 分钟
- ✅ 订单 `clearAll` action，商户可清空所有订单

### 优化改进
- ⚡ 状态码精简：从 7 个状态合并为 6 个（删除"已出餐"）
- ⚡ 查询优化：`shopInfo` 使用固定 ID 避免全表扫描
- ⚡ 云函数整合：25 个独立云函数 → 8 个模块化云函数
- ⚡ 接单自动打印后厨单

### Bug 修复
- 🐛 云函数调用名称错误（使用旧独立函数名）
- 🐛 商户后台使用模拟数据导致操作失败
- 🐛 订单删除权限限制过严
- 🐛 地址修改/删除缺少权限验证
- 🐛 取消订单后列表未刷新
- 🐛 商户端订单卡片缺少删除按钮

### 安全修复
- 🔒 地址 `update`、`delete`、`setDefault` 添加所有权验证

### 文档更新
- 📝 README.md 更新项目说明和性能优化章节
- 📝 DEPLOY.md 简化部署指南
- 📝 QUICKSTART.md 更新快速开始指南
- 📝 cloudfunctions/README.md 更新 API 文档
- 📝 database/README.md 更新订单状态说明

### 文件清理
- 🗑️ 删除 `DEPLOYMENT.md`（合并到 DEPLOY.md）
- 🗑️ 删除临时报告文档
- 🗑️ 删除空的 cloudbase 目录
- 🗑️ 清空模拟数据 `mock.js`
- 🔑 移除敏感配置（envId 改为占位符）

---

## 升级指南

### 从旧版本升级

1. **更新云函数**
   ```
   右键 cloudfunctions → 同步云函数列表
   ```

2. **重新初始化数据库**
   ```javascript
   wx.cloud.callFunction({ 
     name: 'initDatabase', 
     data: { force: true, testOrders: true } 
   })
   ```

3. **更新 shopInfo 固定 ID**
   - 在云开发控制台，将 `shopInfo` 集合的记录 `_id` 改为 `main`

4. **清除缓存**
   - 微信开发者工具 → 清缓存 → 全部清除

### 订单状态迁移

旧状态码映射：
| 旧状态码 | 新状态码 | 状态 |
|---------|---------|------|
| 0 | 0 | 待支付 |
| 1 | 1 | 待接单 |
| 2 | 2 | 制作中 |
| 3 | ❌ 删除 | 已出餐 |
| 4 | 3 | 已完成 |
| 5 | 4 | 已取消 |
| 6 | 5 | 已退款 |

如需迁移旧数据，在云开发控制台执行：
```javascript
// 将旧状态码 3 改为 2 或 3
db.collection('orders').where({ status: 3 }).update({ data: { status: 3 } })
db.collection('orders').where({ status: 4 }).update({ data: { status: 3 } })
db.collection('orders').where({ status: 5 }).update({ data: { status: 4 } })
db.collection('orders').where({ status: 6 }).update({ data: { status: 5 } })
```