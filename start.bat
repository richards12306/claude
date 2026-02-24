@echo off
chcp 65001 >nul 2>&1
REM ╔══════════════════════════════════════════════════════════╗
REM ║      AI化潜力评估顾问 — 启动脚本 (Windows)               ║
REM ╚══════════════════════════════════════════════════════════╝
REM
REM 用法示例：
REM   1. 直接双击运行（会引导你输入配置）
REM   2. 命令行传参：
REM      set API_KEY=sk-ant-xxx && start.bat
REM   3. DeepSeek:
REM      set API_KEY=sk-xxx && set API_BASE_URL=https://api.deepseek.com && set API_MODEL=deepseek-chat && start.bat

echo.
echo ======================================
echo   AI化潜力评估顾问  ·  启动向导
echo ======================================
echo.

REM Check Node.js
where node >nul 2>&1
if errorlevel 1 (
    echo [错误] 未检测到 Node.js，请先安装：
    echo        https://nodejs.org
    pause
    exit /b 1
)
for /f "tokens=*" %%v in ('node -v') do echo [OK] Node.js %%v 已就绪

REM Check API Key
if "%API_KEY%"=="" if "%ANTHROPIC_API_KEY%"=="" (
    echo.
    echo 请选择 API 类型：
    echo   [1] Anthropic 官方 API (Claude)
    echo   [2] OpenAI 兼容接口 (DeepSeek / OpenRouter / 其他)
    echo.
    set /p choice="选择 (1/2): "

    if "!choice!"=="1" (
        set /p API_KEY="请输入 Anthropic API Key (sk-ant-...): "
    ) else (
        set /p API_KEY="请输入 API Key: "
        set /p API_BASE_URL="请输入 API Base URL (如 https://api.deepseek.com): "
        set /p API_MODEL="请输入模型名称 (如 deepseek-chat): "
    )
)

echo.
echo 正在启动服务…
echo.
node server.js
pause
