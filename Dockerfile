FROM node:18.8 as builder

WORKDIR /app

COPY package.json package-lock.json ./

ENV NODE_ENV=production
RUN npm install

COPY . .

CMD ["npm", "start"]
