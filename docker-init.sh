#!/bin/bash

docker pull node:lts
docker run --name "discord-radio-install" -w "/home/node/app" -v "./:/home/node/app" node:lts npm install > /dev/null
docker rm "discord-radio-install" > /dev/null