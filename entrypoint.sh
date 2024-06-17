#!/bin/bash

set -x

apt update
apt install -y ffmpeg

cd /home/node/app/
npm install
node ./src/index.js