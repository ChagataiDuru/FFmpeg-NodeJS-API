FROM node:18
VOLUME ["/root"]
ADD ffmpeg-setup.sh /root
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install
COPY node_modules ./node_modules
COPY . .
EXPOSE 8080
CMD [ "npm", "start" ]