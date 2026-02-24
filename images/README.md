# 图片资源说明

本目录用于存放小程序所需的图片资源。

## 所需图片列表

### TabBar 图标（必需）
- `home.png` - 首页图标（未选中）
- `home-active.png` - 首页图标（选中）
- `menu.png` - 点餐图标（未选中）
- `menu-active.png` - 点餐图标（选中）
- `cart.png` - 购物车图标（未选中）
- `cart-active.png` - 购物车图标（选中）
- `order.png` - 订单图标（未选中）
- `order-active.png` - 订单图标（选中）

### 功能图标（必需）
- `scan.png` - 扫码图标
- `cart-white.png` - 白色购物车图标
- `empty-cart.png` - 空购物车图标
- `empty-order.png` - 空订单图标
- `order-status.png` - 订单状态图标

### 图片规格建议

#### TabBar 图标
- 尺寸：81px × 81px
- 格式：PNG
- 颜色：未选中为灰色，选中为主题色（#FF6B6B）

#### 功能图标
- 尺寸：建议 128px × 128px 或更大
- 格式：PNG（支持透明背景）

#### 菜品图片
- 尺寸：建议 800px × 800px（1:1比例）
- 格式：JPG 或 PNG
- 大小：建议不超过 500KB

#### 分类图片
- 尺寸：建议 800px × 400px（2:1比例）
- 格式：JPG 或 PNG

#### 店铺 Logo
- 尺寸：108px × 108px
- 格式：PNG（支持透明背景）

## 如何获取图片

### 1. 使用免费图标库
- [Iconfont](https://www.iconfont.cn/) - 阿里巴巴矢量图标库
- [Flaticon](https://www.flaticon.com/) - 免费图标资源
- [Iconfinder](https://www.iconfinder.com/) - 图标搜索

### 2. 使用在线生成工具
- [Canva](https://www.canva.com/) - 在线设计工具
- [Fotor](https://www.fotor.com/) - 在线图片编辑

### 3. 自行设计
- 使用 Photoshop、Illustrator 等专业设计软件
- 使用 Sketch、Figma 等UI设计工具

## 临时占位方案

在开发初期，可以使用以下方式作为占位：

1. **使用纯色块**：在代码中使用背景色代替图片
2. **使用占位图服务**：
   - https://via.placeholder.com/
   - https://placehold.co/
3. **使用 Emoji**：在文本中使用 Emoji 图标

## 上传到云存储

图片准备好后，建议上传到微信云存储：

1. 打开微信开发者工具
2. 进入"云开发" -> "存储"
3. 点击"上传文件"
4. 选择图片并上传
5. 复制文件的下载地址（https://...）

## 更新代码中的图片路径

将代码中的图片路径替换为云存储地址：

```javascript
// 示例
image: 'https://xxx-xxx.cloud.tcb.qcloud.la/images/dish.jpg'
```

## 注意事项

1. 图片命名使用英文，避免使用中文
2. 图片文件名使用小写字母和连字符
3. 压缩图片大小，优化加载速度
4. 使用合适的图片格式（JPG适合照片，PNG适合图标）
5. 考虑使用 WebP 格式以获得更好的压缩率