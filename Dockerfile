FROM node:24-bookworm-slim
RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates ffmpeg libnss3 libdbus-1-3 libatk1.0-0 libatk-bridge2.0-0 libcups2 libdrm2 libxkbcommon0 libxcomposite1 libxdamage1 libxfixes3 libxrandr2 libgbm1 libasound2 libpango-1.0-0 libcairo2 fonts-liberation && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npx remotion browser ensure && npm run build:online
ENV NODE_ENV=production APP_ONLINE=true APP_DATA_DIR=/data PORT=4321
EXPOSE 4321
CMD ["node", "scripts/online/start.mjs"]
