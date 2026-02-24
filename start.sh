#!/bin/bash
# ╔══════════════════════════════════════════════════════════╗
# ║        AI化潜力评估顾问 — 启动脚本 (Mac / Linux)          ║
# ╚══════════════════════════════════════════════════════════╝
#
# 用法示例：
#
#   1. 使用 Anthropic 官方 API：
#      ./start.sh
#      （会提示你输入 API Key）
#
#   2. 直接传入 API Key（Anthropic）：
#      API_KEY=sk-ant-xxx ./start.sh
#
#   3. 使用 DeepSeek：
#      API_KEY=sk-xxx API_BASE_URL=https://api.deepseek.com API_MODEL=deepseek-chat ./start.sh
#
#   4. 使用 OpenRouter：
#      API_KEY=sk-or-xxx API_BASE_URL=https://openrouter.ai/api API_MODEL=anthropic/claude-opus-4 ./start.sh
#
#   5. 自定义端口：
#      PORT=8080 API_KEY=sk-xxx ./start.sh

set -e

echo ""
echo "╔══════════════════════════════════════╗"
echo "║     AI化潜力评估顾问  ·  启动向导     ║"
echo "╚══════════════════════════════════════╝"
echo ""

# Check Node.js
if ! command -v node &>/dev/null; then
  echo "✗ 未检测到 Node.js，请先安装："
  echo "  https://nodejs.org"
  exit 1
fi
echo "✓ Node.js $(node -v) 已就绪"

# API Key
if [ -z "$API_KEY" ] && [ -z "$ANTHROPIC_API_KEY" ]; then
  echo ""
  echo "请选择 API 类型："
  echo "  [1] Anthropic 官方 API（Claude）"
  echo "  [2] OpenAI 兼容接口（DeepSeek / OpenRouter / 其他）"
  echo "  [3] 直接启动（已通过环境变量配置）"
  echo ""
  read -rp "选择 (1/2/3): " choice

  case "$choice" in
    1)
      read -rp "请输入 Anthropic API Key (sk-ant-...): " input_key
      export API_KEY="$input_key"
      ;;
    2)
      read -rp "请输入 API Key: " input_key
      read -rp "请输入 API Base URL（如 https://api.deepseek.com）: " input_url
      read -rp "请输入模型名称（如 deepseek-chat）: " input_model
      export API_KEY="$input_key"
      export API_BASE_URL="$input_url"
      export API_MODEL="$input_model"
      ;;
    3)
      echo "使用已有环境变量启动…"
      ;;
    *)
      echo "已取消"
      exit 0
      ;;
  esac
fi

echo ""
echo "正在启动服务…"
exec node server.js
