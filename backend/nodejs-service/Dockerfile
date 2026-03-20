FROM node:22-alpine AS base
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY tsconfig.json tsconfig.json
COPY prisma prisma
RUN npx prisma generate

COPY src src
RUN npm run build

EXPOSE 3000
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/src/server.js"]
