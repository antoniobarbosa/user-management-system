# syntax=docker/dockerfile:1

FROM node:22-alpine AS builder

WORKDIR /app

RUN apk add --no-cache openssl python3 make g++

COPY package.json package-lock.json ./
RUN npm install

COPY prisma ./prisma
COPY tsconfig.json ./
COPY src ./src

RUN npx prisma generate
RUN npm run build

# ---

FROM node:22-alpine AS runner

WORKDIR /app

RUN apk add --no-cache openssl python3 make g++

ENV NODE_ENV=production

COPY package.json package-lock.json ./
RUN npm install --omit=dev \
  && npm install prisma@6.19.3 --no-save \
  && npm cache clean --force \
  && apk del python3 make g++

COPY prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/dist ./dist

EXPOSE 3001

CMD ["sh", "-c", "npx prisma migrate deploy && node dist/index.js"]
