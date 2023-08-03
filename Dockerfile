FROM node:18
VOLUME ["/root"]
ADD ffmpeg-setup.sh /root
RUN /root/ffmpeg-setup.sh
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 8080
CMD [ "npm", "start" ]