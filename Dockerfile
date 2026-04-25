FROM node:lts

WORKDIR /home/node/app/
COPY package.json /home/node/app/
COPY src/ /home/node/app/src/
COPY .[git]/ /home/node/app/.git/

RUN apt-get update && \
    apt-get install -y \
        git \
        ffmpeg \
        libopus-dev \
        libsodium-dev \
        libssl-dev \
        python3 \
        make \
        g++

RUN npm i --production
RUN apt-get purge -y --auto-remove make g++ python3
RUN rm -rf /var/lib/apt/lists/*

CMD [ "node", "./src/index.js" ]