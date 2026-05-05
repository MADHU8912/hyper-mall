FROM node:20

WORKDIR /app

# copy backend dependencies
COPY backend/package*.json ./
RUN npm install

# copy backend code
COPY backend .

# ✅ ADD THIS (VERY IMPORTANT)
COPY frontend ./frontend

EXPOSE 10000

CMD ["node", "server.js"]