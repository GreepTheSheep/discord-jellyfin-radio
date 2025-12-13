FROM node:lts

WORKDIR /home/node/app/
COPY package.json /home/node/app/
COPY src/ /home/node/app/src/
RUN npm i --production

CMD [ "node", "./src/index.js" ]