FROM node:lts

WORKDIR /home/node/app/
COPY package.json /home/node/app/
COPY package-lock.json /home/node/app/
COPY src/ /home/node/app/src/
COPY .git/ /home/node/app/.git/

RUN apt update
RUN apt install -y ffmpeg
RUN npm i --production

CMD [ "node", "./src/index.js" ]