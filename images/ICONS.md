# 图标文件说明

## 当前状态

由于无法直接创建 PNG 图片文件，当前使用 emoji 作为临时替代方案。

## 需要的图标文件

### TabBar 图标（81x81px，PNG 格式）

| 文件名 | 说明 | 临时方案 |
|--------|------|---------|
| home.png | 首页图标（未选中） | 🏠 |
| home-active.png | 首页图标（选中） | 🏠 |
| menu.png | 点餐图标（未选中） | 🍽️ |
| menu-active.png | 点餐图标（选中） | 🍽️ |
| cart.png | 购物车图标（未选中） | 🛒️ |
| cart-active.png | 购物车图标（选中） | 🛒️ |
| order.png | 订单图标（未选中） | 📋 |
| order-active.png | 订单图标（选中） | 📋 |

### 功能图标

| 文件名 | 说明 | 临时方案 |
|--------|------|---------|
| scan.png | 扫码图标 | 📱 |
| empty-cart.png | 空购物车 | 🛒️ |
| empty-order.png | 空订单 | 📋 |
| order-status.png | 订单状态 | ✅ |

## 如何获取图标

### 方案 1：下载免费图标（推荐）

**推荐网站**：
1. [Iconfont](https://www.iconfont.cn/) - 阿里巴巴矢量图标库
   - 搜索关键词：home, menu, cart, order
   - 下载 PNG 格式
   - 尺寸：81x81px

2. [Flaticon](https://www.flaticon.com/)
   - 搜索关键词：restaurant, food, delivery
   - 下载免费图标
   - 注意选择免费许可

3. [Iconfinder](https://www.iconfinder.com/)
   - 搜索关键词：mobile app icons
   - 筛选免费图标

**图标风格建议**：
- 线性图标
- 扁平化设计
- 主色调：#FF6B6B（红色）
- 未选中色：#999999（灰色）

### 方案 2：使用在线工具生成

**推荐工具**：
1. [Canva](https://www.canva.com/)
   - 选择"图标"模板
   - 自定义颜色和尺寸
   - 导出为 PNG

2. [Figma](https://www.figma.com/)
   - 使用图标插件
   - 设计自定义图标
   - 导出为 PNG

3. [IconKitchen](https://icon.kitchen/)
   - 快速生成图标
   - 选择样式和颜色
   - 下载 PNG

### 方案 3：使用 AI 生成

**推荐工具**：
1. [Midjourney](https://www.midjourney.com/)
   - 提示词：minimal app icon, red and gray
   - 生成后裁剪和调整

2. [DALL-E](https://openai.com/dall-e-2)
   - 提示词：simple restaurant app icons
   - 生成后转换为 PNG

## 图标设计规范

### 尺寸要求

| 用途 | 尺寸 | 格式 |
|-----|------|------|
| TabBar 图标 | 81x81px | PNG |
| 功能图标 | 建议 128x128px | PNG |
| 菜品图片 | 建议 800x800px | JPG/PNG |

### 颜色规范

| 用途 | 主色 | 未选中/辅助色 |
|-----|------|------------|
| 主题色 | #FF6B6B | - |
| 未选中 | - | #999999 |
| 背景 | #FFFFFF | #F5F5F5 |
| 文字 | #333333 | #666666 |

## 替代方案：使用 Emoji

如果暂时无法准备图标，可以使用 emoji 作为临时方案：

### TabBar 配置示例

```json
{
  "tabBar": {
    "color": "#999999",
    "selectedColor": "#FF6B6B",
    "backgroundColor": "#FFFFFF",
    "borderStyle": "black",
    "list": [
      {
        "pagePath": "pages/index/index",
        "text": "首页",
        "iconPath": "images/home.png",
        "selectedIconPath": "images/home-active.png"
      },
      {
        "pagePath": "pages/menu/menu",
        "text": "点餐",
        "iconPath": "images/menu.png",
        "selectedIconPath": "images/menu-active.png"
      },
      {
        "pagePath": "pages/cart/cart",
        "text": "购物车",
        "iconPath": "images/cart.png",
        "selectedIconPath": "images/cart-active.png"
      },
      {
        "pagePath": "pages/order/order",
        "text": "订单",
        "iconPath": "images/order.png",
        "selectedIconPath": "images/order-active.png"
      }
    ]
  }
}
```

### 注意事项

1. **图标文件必须存在**：否则会报错
2. **图标尺寸要一致**：所有 TabBar 图标应该是相同尺寸
3. **颜色要区分**：选中状态和未选中状态颜色要明显区分
4. **图标要清晰**：在小屏幕上也要清晰可见

## 快速开始

### 临时方案（立即使用）

使用当前底部导航栏（已实现），无需图标文件。

### 完整方案（推荐）

1. 下载或设计图标
2. 放入 `images` 目录
3. 恢复 `app.json` 中的 tabBar 配置
4. 重新编译项目

## 需要帮助？

如果需要帮助准备图标，可以：
1. 告诉我您想要的风格（简约、卡通、写实等）
2. 我可以提供更具体的设计建议
3. 推荐合适的图标资源网站