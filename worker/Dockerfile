FROM node:20-alpine

WORKDIR /app

COPY worker/package.json worker/package-lock.json* ./
COPY src/prisma ./prisma/

RUN npm ci \
	&& npx prisma generate --schema=./prisma/schema.prisma

COPY worker/ ./
RUN npm run build

ENV NODE_ENV=production
CMD ["node", "dist/index.js"]
