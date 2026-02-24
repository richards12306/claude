'use strict';

/**
 * AI化潜力评估顾问 — 本地服务器
 *
 * 支持的 AI 提供商：
 *   - Anthropic 原生 API（默认）
 *   - 任何 OpenAI 兼容接口（DeepSeek、OpenRouter、本地 Ollama 等）
 *
 * 环境变量：
 *   API_KEY        必填   你的 API Key
 *   API_BASE_URL   选填   自定义 API 地址，不填则使用 Anthropic 官方
 *   API_MODEL      选填   模型名称，不填则自动选默认值
 *   PORT           选填   端口号，默认 3000
 */

const http  = require('http');
const https = require('https');
const http2 = require('http'); // fallback
const fs    = require('fs');
const path  = require('path');
const os    = require('os');
const url   = require('url');

/* ── Configuration ──────────────────────────────────── */
const API_KEY      = process.env.API_KEY || process.env.ANTHROPIC_API_KEY || '';
const API_BASE_URL = (process.env.API_BASE_URL || '').replace(/\/$/, ''); // trim trailing slash
const API_MODEL    = process.env.API_MODEL || '';
const PORT         = parseInt(process.env.PORT || '3000', 10);

// Detect provider mode
const isAnthropicMode = !API_BASE_URL || API_BASE_URL.includes('api.anthropic.com');

// Resolve defaults
const resolvedModel = API_MODEL || (isAnthropicMode ? 'claude-opus-4-6' : 'deepseek-chat');

/* ── Startup validation ─────────────────────────────── */
if (!API_KEY) {
  const line = '─'.repeat(54);
  console.error(`\n${line}`);
  console.error('  ❌  未找到 API Key，请按以下方式配置：');
  console.error(`${line}\n`);
  console.error('  【Anthropic 原生 API】');
  console.error('    Linux/Mac: API_KEY=sk-ant-xxx node server.js');
  console.error('    Windows:   set API_KEY=sk-ant-xxx && node server.js\n');
  console.error('  【OpenAI 兼容接口（DeepSeek / OpenRouter 等）】');
  console.error('    Linux/Mac: API_KEY=sk-xxx API_BASE_URL=https://api.deepseek.com API_MODEL=deepseek-chat node server.js');
  console.error('    Windows:   set API_KEY=sk-xxx && set API_BASE_URL=https://api.deepseek.com && set API_MODEL=deepseek-chat && node server.js\n');
  process.exit(1);
}

/* ── Parse API endpoint ─────────────────────────────── */
function parseEndpoint() {
  if (isAnthropicMode) {
    return {
      protocol: 'https:',
      hostname: 'api.anthropic.com',
      port: 443,
      basePath: ''
    };
  }
  // Parse custom URL
  try {
    const parsed = new url.URL(API_BASE_URL);
    return {
      protocol: parsed.protocol,
      hostname: parsed.hostname,
      port: parseInt(parsed.port) || (parsed.protocol === 'https:' ? 443 : 80),
      basePath: parsed.pathname === '/' ? '' : parsed.pathname
    };
  } catch (e) {
    console.error(`无法解析 API_BASE_URL: "${API_BASE_URL}"\n错误: ${e.message}`);
    process.exit(1);
  }
}

const endpoint = parseEndpoint();

/* ── LAN IP helper ──────────────────────────────────── */
function getLANIPs() {
  const ips = [];
  const ifaces = os.networkInterfaces();
  for (const name of Object.keys(ifaces)) {
    for (const iface of ifaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) ips.push(iface.address);
    }
  }
  return ips;
}

/* ── HTTP request helper ────────────────────────────── */
function doRequest(options, body) {
  return new Promise((resolve, reject) => {
    const lib = endpoint.protocol === 'https:' ? https : require('http');
    const req = lib.request(options, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => resolve({ status: res.statusCode, body: data }));
    });
    req.on('timeout', () => { req.destroy(); reject(new Error('请求超时（90s），请检查网络')); });
    req.on('error', e => reject(new Error('网络请求失败: ' + e.message)));
    req.write(body);
    req.end();
  });
}

/* ── Claude / OpenAI call ───────────────────────────── */
async function callAI(userData) {
  const systemPrompt = `你是一位专业的AI转型顾问，拥有丰富的企业AI化战略规划经验。根据用户提供的工作信息，生成一份专业、洞察深刻、具有实际指导意义的AI化潜力评估报告。

只返回合法的JSON对象，不要有任何其他文字或markdown标记。格式严格如下：
{
  "score": <0到100的整数>,
  "scoreLabel": <"极高潜力" 或 "高潜力" 或 "中等潜力" 或 "初期探索">,
  "scoreExplanation": "<2-3句话，解释评分理由，结合用户实际填写的信息>",
  "matrix": [
    {"task": "<具体任务名称>", "valueLevel": "<高|中|低>", "autoLevel": "<易|中|难>", "recommendation": "<简短建议，10字以内>"}
  ],
  "quickWins": [
    {
      "title": "<机会标题，8字以内>",
      "description": "<2-3句具体描述，说明如何实施、有什么效果>",
      "tools": ["<推荐工具1>", "<推荐工具2>"],
      "timeSaved": "<预计节省，如3-5小时/周>",
      "difficulty": "<低|中|高>"
    }
  ],
  "skillTrends": [
    {"skill": "<技能名>", "priority": "<紧迫|重要|了解>", "reason": "<一句话理由>"}
  ],
  "personalNote": "<针对该用户的个性化总结，温暖而专业，1-2段>"
}

严格要求：
- matrix 包含 3-5 项，基于用户填写的工作类型推断具体任务
- quickWins 恰好 3 项，必须具体可操作
- skillTrends 恰好 4 项
- 所有内容结合用户实际填写的工具、工作类型和时间黑洞
- 使用简体中文`;

  const userMessage = `请根据以下信息生成AI化潜力评估报告：

姓名：${userData.name}
职位：${userData.role}
常用工具：${(userData.tools||[]).join('、')||'未填写'}
工作类型：${(userData.workTypes||[]).join('、')||'未填写'}
时间黑洞（最耗时任务）：${(userData.timeSinks||[]).join('、')||'未填写'}
AI接受程度：${userData.aiAttitude||'未填写'}
具体痛点：${userData.painPoints||'用户未填写'}`;

  let bodyStr, reqOptions;

  if (isAnthropicMode) {
    /* ── Anthropic format ── */
    const payload = {
      model: resolvedModel,
      max_tokens: 2048,
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessage }]
    };
    bodyStr = JSON.stringify(payload);
    reqOptions = {
      hostname: endpoint.hostname,
      port: endpoint.port,
      path: `${endpoint.basePath}/v1/messages`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(bodyStr),
        'x-api-key': API_KEY,
        'anthropic-version': '2023-06-01'
      },
      timeout: 90000
    };
  } else {
    /* ── OpenAI-compatible format ── */
    const payload = {
      model: resolvedModel,
      max_tokens: 2048,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user',   content: userMessage  }
      ]
    };
    bodyStr = JSON.stringify(payload);
    reqOptions = {
      hostname: endpoint.hostname,
      port: endpoint.port,
      path: `${endpoint.basePath}/v1/chat/completions`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(bodyStr),
        'Authorization': `Bearer ${API_KEY}`
      },
      timeout: 90000
    };
  }

  const { status, body: rawBody } = await doRequest(reqOptions, bodyStr);
  const parsed = JSON.parse(rawBody);

  // Check for API-level errors
  if (parsed.error) {
    const msg = parsed.error.message || JSON.stringify(parsed.error);
    throw new Error(`API 错误 (${status}): ${msg}`);
  }

  // Extract text content
  let text = '';
  if (isAnthropicMode) {
    text = parsed.content?.[0]?.text || '';
  } else {
    text = parsed.choices?.[0]?.message?.content || '';
  }

  if (!text) throw new Error('AI 返回了空内容，请检查模型配置');

  // Extract JSON (handle potential markdown wrapping)
  const m = text.match(/```(?:json)?\s*([\s\S]*?)```/) || text.match(/(\{[\s\S]*\})/);
  const jsonStr = m ? (m[1] || m[0]).trim() : text.trim();

  try {
    return JSON.parse(jsonStr);
  } catch (e) {
    throw new Error(`报告 JSON 解析失败。原始内容片段：${text.slice(0, 200)}`);
  }
}

/* ── HTTP Server ────────────────────────────────────── */
const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }

  // API route
  if (req.method === 'POST' && req.url === '/api/generate-report') {
    let body = '';
    req.on('data', c => body += c);
    req.on('end', async () => {
      try {
        const userData = JSON.parse(body);
        console.log(`[${ts()}] ▶ 生成报告 → ${userData.name}（${userData.role}）`);
        const report = await callAI(userData);
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ success: true, report }));
        console.log(`[${ts()}] ✓ 报告生成完成`);
      } catch (e) {
        console.error(`[${ts()}] ✗ 失败:`, e.message);
        res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ success: false, error: e.message }));
      }
    });
    return;
  }

  // Serve HTML
  if (req.method === 'GET') {
    fs.readFile(path.join(__dirname, 'index.html'), (err, data) => {
      if (err) { res.writeHead(500); res.end('无法读取 index.html'); return; }
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(data);
    });
    return;
  }

  res.writeHead(404); res.end('Not Found');
});

function ts() { return new Date().toLocaleTimeString('zh-CN'); }

server.listen(PORT, '0.0.0.0', () => {
  const ips  = getLANIPs();
  const line = '─'.repeat(54);
  const mode = isAnthropicMode ? 'Anthropic 原生 API' : `OpenAI 兼容 → ${API_BASE_URL}`;

  console.log(`\n${line}`);
  console.log('  ✦  AI化潜力评估顾问  ·  服务已启动');
  console.log(`${line}\n`);
  console.log(`  提供商   →  ${mode}`);
  console.log(`  模型     →  ${resolvedModel}`);
  console.log(`\n  本机访问  →  http://localhost:${PORT}`);
  ips.forEach(ip => console.log(`  局域网    →  http://${ip}:${PORT}`));
  console.log('\n  将局域网地址分享给同事即可直接访问');
  console.log('  按 Ctrl+C 停止服务');
  console.log(`\n${line}\n`);
});
