FROM node:20-alpine AS base

# --- Dependencies ---
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
COPY prisma ./prisma/
RUN npm install

# --- Build ---
FROM base AS build
ARG NITRO_BUILD_MAX_OLD_SPACE_SIZE=4096
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN NODE_OPTIONS="--max-old-space-size=${NITRO_BUILD_MAX_OLD_SPACE_SIZE}" npm run build

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
