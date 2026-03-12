# 打印机和通知功能说明

## 功能概述

### 1. 蓝牙打印机支持
- 支持 ESC/POS 协议的蓝牙热敏打印机
- 58mm 纸张宽度
- 自动搜索和连接打印机
- 自动打印新订单小票

### 2. 订单小票格式
- 店铺名称和联系方式
- 订单号、订单类型
- 菜品明细和数量
- 合计金额
- 备注

### 3. 后厨单
- 简化版打印单
- 仅显示菜品和数量
- 适合后厨使用

### 4. 新订单通知
- 震动提醒
- 弹窗通知

---

## 使用方法

### 1. 连接打印机

1. 进入商家后台
2. 点击顶部「🖨️ 打印机」链接
3. 点击「搜索」按钮
4. 在列表中选择您的打印机
5. 点击「连接」

### 2. 配置打印设置

在打印机设置页面可以配置：
- 自动打印新订单：开启后新订单自动打印
- 打印后厨单：开启后同时打印后厨单
- 订单通知语音：开启震动提醒

### 3. 测试打印

连接成功后，点击「测试打印」按钮验证打印机是否正常工作。

---

## 支持的打印机

支持 ESC/POS 协议的蓝牙热敏打印机，常见品牌：
- 芯烨（Xprinter）
- 佳博（Gprinter）
- 商米（Sunmi）
- 其他支持蓝牙的 58mm 热敏打印机

---

## 文件说明

| 文件 | 说明 |
|-----|------|
| `utils/bluetooth-printer.js` | 蓝牙打印机连接和通信 |
| `utils/print-template.js` | 打印模板生成 |
| `utils/print-service.js` | 打印服务封装 |
| `utils/order-notification.js` | 订单通知服务 |
| `packageMerchant/printerSetting/` | 打印机设置页面 |

---

## API 接口

### 打印服务

```javascript
const printService = require('../../utils/print-service.js')

// 搜索打印机
await printService.searchPrinters()

// 连接打印机
await printService.connectPrinter(deviceId, deviceName)

// 打印订单
await printService.printOrder(order, shopInfo)

// 打印后厨单
await printService.printKitchenTicket(order)

// 测试打印
await printService.testPrint()
```

### 通知服务

```javascript
const notification = require('../../utils/order-notification.js')

// 初始化
notification.init()

// 播放新订单提示
notification.playNewOrderVoice()

// 震动提醒
notification.vibrate()

// 显示弹窗
notification.showNewOrderModal(order, onConfirm, onCancel)
```

---

## 注意事项

1. 首次使用需要在手机设置中授权蓝牙权限
2. 确保打印机已开启并有足够的纸张
3. 如果连接失败，请尝试重启打印机和手机蓝牙
4. 部分打印机可能需要配对，请在手机蓝牙设置中先配对

---

## 定时触发器配置

为自动取消超时订单，需要在云开发控制台配置定时触发器：

1. 进入云开发控制台
2. 选择「云函数」→「cancelTimeoutOrders」
3. 点击「定时触发器」
4. 添加触发器：
   - 名称：cancelTimeoutOrders
   - 触发周期：自定义
   - Cron 表达式：`*/5 * * * *`（每5分钟执行一次）
5. 保存