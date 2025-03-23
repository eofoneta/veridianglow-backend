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

# command to build docker 
# docker build -t veridianglow-api/veridianglow-api:1.0.0 -f
# run this command to have a latest and previous version
# docker build -t veridianglow/veridianglow:latest -t veridianglow/veridianglow:1.0.0 -f Dockerfile .
# run this command to push to dockerhub 
# 