#!/bin/bash

set -x

apt update
apt install -y ffmpeg

cd /home/node/app/
# Run N.eko
node ./src/index.js