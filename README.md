# AI化潜力评估顾问

一个对话式 AI 工作优化顾问，通过 7 步引导问答，为用户生成个性化的《AI化潜力评估报告》。

## 功能特性

- 对话引导式体验（7步问答 + 芯片选择交互）
- AI 生成专属报告：潜力评分、任务优化矩阵、3个快赢机会、技能趋势建议
- 局域网多人共享访问（一人启动，同事通过浏览器访问）
- 打印 / 保存 PDF / 复制摘要

## 快速启动

**前置要求：** [Node.js](https://nodejs.org) v16+（无需 npm install）

### Mac / Linux

```bash
# 引导脚本（推荐，会交互式引导配置）
./start.sh

# 或直接启动
API_KEY=sk-ant-xxx node server.js
```

### Windows

```bat
:: 双击 start.bat（引导输入配置）

:: 或命令行
set API_KEY=sk-ant-xxx && node server.js
```

---

## 支持的 AI 提供商

不限于 Anthropic，任何 OpenAI 兼容接口均可使用：

| 提供商 | 示例命令 |
|--------|---------|
| **Anthropic**（默认） | `API_KEY=sk-ant-xxx node server.js` |
| **DeepSeek** | `API_KEY=sk-xxx API_BASE_URL=https://api.deepseek.com API_MODEL=deepseek-chat node server.js` |
| **OpenRouter** | `API_KEY=sk-or-xxx API_BASE_URL=https://openrouter.ai/api API_MODEL=anthropic/claude-opus-4 node server.js` |
| **其他兼容接口** | `API_KEY=xxx API_BASE_URL=https://your-api.com API_MODEL=model-name node server.js` |

## 环境变量

| 变量 | 必填 | 说明 |
|------|------|------|
| `API_KEY` | ✅ | API Key（也可用 `ANTHROPIC_API_KEY`） |
| `API_BASE_URL` | 可选 | 自定义接口地址，不填则使用 Anthropic 官方 |
| `API_MODEL` | 可选 | 模型名称，不填则自动选默认值 |
| `PORT` | 可选 | 端口号，默认 `3000` |

## 启动后访问

控制台会输出：

```
本机访问  →  http://localhost:3000
局域网    →  http://192.168.x.x:3000
```

将局域网地址分享给同事，浏览器直接打开即可，无需安装任何软件。

## 项目文件

```
├── server.js    Node.js 服务器（零 npm 依赖，仅用内置模块）
├── index.html   前端单页面（含全部 CSS/JS，可独立分发）
├── start.sh     Mac/Linux 引导启动脚本
├── start.bat    Windows 引导启动脚本
└── README.md
```
