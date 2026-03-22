FROM node:22-slim AS base
WORKDIR /app

RUN apt-get update \
    && apt-get install -y --no-install-recommends openssl ca-certificates \
    && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
RUN npm ci

COPY tsconfig.json tsconfig.json
COPY prisma prisma
RUN npx prisma generate

COPY src src
RUN npm run build

EXPOSE 3000
CMD ["node", "dist/src/server.js"]
