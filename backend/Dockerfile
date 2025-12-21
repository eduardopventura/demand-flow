# Backend Dockerfile - PostgreSQL + Prisma

FROM node:20-alpine

LABEL maintainer="Demand Flow Team"
LABEL description="Backend with PostgreSQL and Prisma"

# Install OpenSSL for Prisma
RUN apk add --no-cache openssl libc6-compat

WORKDIR /app

# Copy package files
COPY package*.json ./

# Copy Prisma schema (needed for generation)
COPY prisma ./prisma/

# Install dependencies (inclui Prisma)
RUN npm install --omit=dev

# Generate Prisma Client durante o build
RUN npx prisma generate

# Copy application files
COPY . .

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start server
CMD ["npm", "start"]

