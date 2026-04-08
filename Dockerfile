FROM node:20-alpine

WORKDIR /app

COPY backend/package*.json ./backend/
RUN cd backend && npm ci

COPY backend/ ./backend/
RUN cd backend && npm run build
RUN cd backend && npm prune --production

COPY frontend/ ./frontend/

WORKDIR /app/backend
EXPOSE 3000
CMD ["npm", "start"]
