# syntax=docker/dockerfile:1.7

########## Build Stage ##########
FROM node:20-alpine AS builder
WORKDIR /app
RUN apk add --no-cache libc6-compat python3 make g++ && corepack enable

# ใส่ ARG ที่ต้อง bake ลงฝั่ง client ให้เรียบร้อย
ARG NEXT_PUBLIC_API_BASE_URL
ARG NEXTAUTH_URL
ENV NEXT_PUBLIC_API_BASE_URL=${NEXT_PUBLIC_API_BASE_URL}
ENV NEXTAUTH_URL=${NEXTAUTH_URL}

# ติดตั้งและ build
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm build

########## Runtime Stage ##########
FROM node:20-alpine AS runner
WORKDIR /app
RUN corepack enable

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3399

# เอาของจำเป็นจาก builder มา
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/pnpm-lock.yaml ./pnpm-lock.yaml

EXPOSE 3399
CMD ["pnpm", "start", "--", "-p", "3399"]
