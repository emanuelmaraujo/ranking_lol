FROM node:20-alpine AS base
WORKDIR /app

# Install OpenSSL for Prisma
RUN apk add --no-cache openssl

# Install dependencies (only devOps aware)
COPY package*.json ./
RUN npm ci

# Copy Source & Prisma Schema
COPY prisma ./prisma/
COPY tsconfig.json ./
COPY src ./src/
COPY .env ./

# Generate Prisma Client
RUN npx prisma generate

# --- API Stage ---
FROM base AS api
EXPOSE 3333
CMD ["npm", "run", "start:server"]

# --- Jobs Stage ---
FROM base AS jobs
# No exposed ports necessary
# Singleton warning is handled in docker-compose
CMD ["npm", "run", "start:jobs"]
