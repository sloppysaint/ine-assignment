# Multi-stage build
FROM node:20-alpine as builder

# Build client
WORKDIR /app/client
COPY client/package*.json ./
RUN npm ci
COPY client/ ./
RUN npm run build

# Build server
WORKDIR /app/server
COPY server/package*.json ./
RUN apk add --no-cache ca-certificates 
RUN npm ci
COPY server/ ./
RUN npm run build

# Production stage
FROM node:20-alpine as production
WORKDIR /app

# Copy server build and dependencies
COPY server/package*.json ./
RUN npm ci --only=production

COPY --from=builder /app/server/dist ./dist
COPY --from=builder /app/client/dist ./public

EXPOSE 8080
CMD ["npm", "start"]