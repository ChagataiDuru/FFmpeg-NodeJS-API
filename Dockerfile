FROM node:alpine
RUN apk add  --no-cache ffmpeg
VOLUME ["/root"]
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install
COPY node_modules ./node_modules
COPY . .
EXPOSE 8080
CMD [ "npm", "start" ]