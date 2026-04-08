# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

COPY backend/package*.json ./backend/
RUN cd backend && npm install

COPY backend/ ./backend/
RUN cd backend && npm run build

# Production stage
FROM node:20-alpine AS runner

WORKDIR /app

COPY backend/package*.json ./backend/
RUN cd backend && npm install --omit=dev

COPY --from=builder /app/backend/dist ./backend/dist
COPY frontend/ ./frontend/

WORKDIR /app/backend
EXPOSE $PORT
CMD ["node", "dist/api/server.js"]
