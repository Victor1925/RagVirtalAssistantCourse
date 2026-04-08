FROM node:20-alpine

WORKDIR /app

COPY backend/package*.json ./backend/
RUN cd backend && npm ci --only=production

COPY backend/ ./backend/
RUN cd backend && npm run build

COPY frontend/ ./frontend/

WORKDIR /app/backend
EXPOSE 3000
CMD ["npm", "start"]
