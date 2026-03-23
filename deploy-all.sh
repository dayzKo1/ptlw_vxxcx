#!/bin/bash

# 使用微信开发者工具 CLI 批量部署云函数
# 需要先开启微信开发者工具的服务端口：设置 -> 安全设置 -> 服务端口

# 微信开发者工具 CLI 路径（macOS）
CLI="/Applications/wechatwebdevtools.app/Contents/MacOS/cli"

# 项目路径
PROJECT_PATH="/Users/jj/.openclaw/workspace/ptlw_vxxcx"

# 云函数目录
FUNCTIONS_DIR="$PROJECT_PATH/cloudfunctions"

echo "🚀 批量部署云函数"
echo "项目路径: $PROJECT_PATH"
echo ""

# 检查 CLI 是否存在
if [ ! -f "$CLI" ]; then
    echo "❌ 未找到微信开发者工具 CLI"
    echo "   请确保微信开发者工具已安装"
    echo "   并开启服务端口：设置 -> 安全设置 -> 服务端口"
    exit 1
fi

# 获取所有云函数
functions=()
for func_dir in "$FUNCTIONS_DIR"/*/; do
    if [ -d "$func_dir" ]; then
        func_name=$(basename "$func_dir")
        # 跳过 node_modules
        if [ "$func_name" != "node_modules" ]; then
            functions+=("$func_name")
        fi
    fi
done

echo "📋 待部署云函数 (${#functions[@]} 个):"
for func in "${functions[@]}"; do
    echo "   - $func"
done
echo ""

# 逐个上传部署
success_count=0
fail_count=0

for func in "${functions[@]}"; do
    echo "📦 部署: $func"
    
    # 上传云函数
    "$CLI" cloud upload-function \
        --project "$PROJECT_PATH" \
        --functionName "$func" \
        --env cloud1-2gj3ujpj1708bd55
    
    if [ $? -eq 0 ]; then
        echo "   ✅ 成功"
        ((success_count++))
    else
        echo "   ❌ 失败"
        ((fail_count++))
    fi
done

echo ""
echo "================================"
echo "部署完成！"
echo "✅ 成功: $success_count"
echo "❌ 失败: $fail_count"
echo "================================"