FROM node:18

RUN apt-get update && \
    apt-get install -y python3 python3-pip ffmpeg pipx && \
    pipx install yt-dlp && \
    ln -s /root/.local/bin/yt-dlp /usr/local/bin/yt-dlp

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 3000

CMD ["node", "server.js"]