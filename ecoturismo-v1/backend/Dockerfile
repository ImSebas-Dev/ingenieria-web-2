FROM node:20-alpine

WORKDIR /app

# Instalar TypeScript globalmente
RUN npm install -g typescript ts-node nodemon

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 5000

CMD ["npm", "run", "dev"]