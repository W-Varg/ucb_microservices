# Stage 1: Build
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files (including lock file)
COPY package.json package-lock.json ./
COPY tsconfig.json ./
COPY nest-cli.json ./

# Install dependencies (usar npm ci para instalar desde package-lock.json)
RUN npm ci

# Copy source code
COPY src ./src

# Build the application
RUN npm run build

# Stage 2: Production
FROM node:18-alpine

WORKDIR /app

# Copy package files (including lock file)
COPY package.json package-lock.json ./

# Install only production dependencies
RUN npm ci --omit=dev

# Copy built application from builder stage
COPY --from=builder /app/dist ./dist

# Expose port
EXPOSE 3001

# Start the application
CMD ["node", "dist/main"]
