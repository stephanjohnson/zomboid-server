FROM node:20-alpine AS base

# --- Dependencies ---
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
COPY prisma ./prisma/
RUN npm ci

# --- Build ---
FROM base AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# --- Production ---
FROM node:20-alpine AS production
WORKDIR /app

COPY --from=build /app/.output ./.output
COPY --from=deps /app/node_modules ./node_modules
COPY package.json ./
COPY prisma ./prisma/
COPY entrypoint.sh ./entrypoint.sh
RUN chmod +x ./entrypoint.sh

ENV NODE_ENV=production
ENV PATH="/app/node_modules/.bin:$PATH"
EXPOSE 3000

ENTRYPOINT ["./entrypoint.sh"]
