# Dockerfile (MUST be in root)
FROM node:20

WORKDIR /app

# 👇 copy backend package.json
COPY backend/package*.json ./

RUN npm install

# 👇 copy full backend code
COPY backend .

EXPOSE 3000

CMD ["node", "server.js"]