#!/bin/bash

# 批量部署云函数脚本
# 使用方法：在微信开发者工具中打开项目，然后运行此脚本

CLOUD_FUNCTIONS_DIR="./cloudfunctions"

echo "🚀 开始批量部署云函数..."
echo ""

# 获取所有云函数目录
for func_dir in "$CLOUD_FUNCTIONS_DIR"/*/; do
    if [ -d "$func_dir" ]; then
        func_name=$(basename "$func_dir")
        echo "📦 部署: $func_name"
    fi
done

echo ""
echo "⚠️  请在微信开发者工具中操作："
echo "   1. 右键 cloudfunctions 文件夹"
echo "   2. 选择「上传并部署：云端安装依赖」"
echo "   3. 等待所有云函数部署完成"
echo ""
echo "或者使用微信开发者工具命令行："
echo "   cli upload --project . --upload-info-output output.json"