FROM node:18-alpine

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install

COPY tsconfig.json .
COPY src/ ./src/

RUN npm run build

# RUN npm prune --production

EXPOSE 8000

CMD ["node", "dist/server.js"]

# build docker 
# docker build -t lordmaryo/veridianglow-api:latest -f Dockerfile .
# push to dockerhub 
# docker push lordmaryo/veridianglow-api:latest
