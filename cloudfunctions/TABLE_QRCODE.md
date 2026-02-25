# 桌号二维码使用指南

## 概述

桌号二维码用于让顾客通过扫码直接进入小程序并自动识别桌号，实现扫码点餐功能。

---

## 功能说明

### 1. 单个生成二维码
为指定的桌号生成小程序码，顾客扫码后会自动获取桌号信息。

### 2. 批量生成二维码
一次性为所有桌号生成小程序码，提高效率。

---

## 使用步骤

### 第一步：初始化桌号数据

确保数据库中已有桌号数据，如果没有，请先运行 `initDatabase` 云函数初始化。

### 第二步：生成二维码

#### 方法一：批量生成（推荐）

1. 进入小程序"我的"页面
2. 点击"桌号二维码"
3. 点击"批量生成所有二维码"按钮
4. 等待生成完成

#### 方法二：单个生成

1. 进入小程序"我的"页面
2. 点击"桌号二维码"
3. 找到需要生成二维码的桌号
4. 点击"生成二维码"按钮

### 第三步：下载并打印

1. 点击"下载图片"按钮
2. 二维码会保存到手机相册
3. 将二维码图片打印出来
4. 贴到对应的桌子上

---

## 二维码说明

### 二维码格式

生成的二维码为小程序码，包含以下信息：
- **小程序路径**: pages/index/index
- **场景参数**: table=桌号 (例如: table=1)

### 扫码效果

顾客扫描桌号二维码后：
1. 自动打开小程序首页
2. 自动获取桌号信息
3. 桌号显示在首页顶部
4. 订单创建时自动关联桌号

---

## 注意事项

1. **二维码有效期**: 小程序码长期有效，无需担心过期

2. **二维码尺寸**: 建议打印尺寸为 8cm x 8cm 或更大，确保扫码方便

3. **打印材质**: 建议使用防水材质，避免二维码损坏

4. **二维码位置**: 将二维码贴在桌子显眼位置，方便顾客扫码

5. **桌号变更**: 如果桌号信息变更，需要重新生成二维码

6. **权限要求**: 
   - 需要管理员权限才能生成二维码
   - 普通用户无法访问二维码管理页面

---

## 常见问题

### 1. 生成二维码失败

**原因**: 
- 云函数未部署
- 网络问题
- 桌号数据不存在

**解决方法**:
- 检查云函数是否部署成功
- 检查网络连接
- 确认桌号数据是否存在

### 2. 扫码后无法获取桌号

**原因**:
- 小程序未正确处理场景参数
- 桌号数据格式错误

**解决方法**:
- 检查 app.js 中的 loadTableNumber 方法
- 确认场景参数格式正确

### 3. 二维码无法识别

**原因**:
- 二维码尺寸过小
- 打印质量差
- 二维码损坏

**解决方法**:
- 重新生成并打印更大的二维码
- 使用高质量打印机
- 更换二维码

---

## 技术实现

### 云函数

#### generateTableQRCode
```javascript
// 生成单个桌号二维码
await wx.cloud.callFunction({
  name: 'generateTableQRCode',
  data: {
    tableNumber: '1号桌',
    page: 'pages/index/index'
  }
})
```

#### batchGenerateTableQRCode
```javascript
// 批量生成所有桌号二维码
await wx.cloud.callFunction({
  name: 'batchGenerateTableQRCode'
})
```

### 小程序码生成

使用微信云开发提供的 `cloud.openapi.wxacode.getUnlimited` API 生成小程序码。

### 场景参数解析

在 app.js 中解析场景参数：
```javascript
loadTableNumber(options) {
  let tableNumber = null
  
  if (options && options.query && options.query.table) {
    tableNumber = options.query.table
  } else if (options && options.scene) {
    const scene = decodeURIComponent(options.scene)
    const tableMatch = scene.match(/table=(\d+)/)
    if (tableMatch) {
      tableNumber = tableMatch[1]
    }
  }
  
  if (tableNumber) {
    wx.setStorageSync('tableNumber', tableNumber)
    this.globalData.tableNumber = tableNumber
  }
}
```

---

## 相关文档

- [云函数说明文档](./README.md)
- [云函数部署指南](./DEPLOY.md)
- [数据库集合说明](./DATABASE.md)
