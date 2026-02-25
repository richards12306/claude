# ── AI化潜力评估顾问 · Dockerfile ─────────────────────────
# 零 npm 依赖，仅拷贝两个文件即可运行
# 构建: docker build -t ai-assessment .
# 运行: docker run -p 3000:3000 -e API_KEY=xxx ai-assessment

FROM node:20-alpine

# 非 root 用户，更安全
RUN addgroup -S app && adduser -S app -G app
WORKDIR /app

# 只复制必要文件（无 node_modules）
COPY server.js index.html ./

USER app
EXPOSE 3000
ENV PORT=3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s \
  CMD wget -qO- http://localhost:3000/ | grep -q "AI" || exit 1

CMD ["node", "server.js"]
