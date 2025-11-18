# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files (including lock file)
COPY package.json package-lock.json ./
COPY tsconfig.json ./
COPY nest-cli.json ./

# Install dependencies (usar npm ci para instalar desde package-lock.json)
RUN npm ci

COPY . .
RUN npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

COPY --from=builder /app/dist ./dist

EXPOSE 3003

CMD ["node", "dist/main"]
