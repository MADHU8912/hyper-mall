# Dockerfile (MUST be in root)
FROM node:18

WORKDIR /app
COPY package*.json ./
RUN npm install

COPY . .

CMD ["node", "backend/server.js"]