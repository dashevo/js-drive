#!/usr/bin/env bash

# source .env
# eval $(aws ecr get-login --no-include-email)

IMAGE_TAG_PREFIX="103738324493.dkr.ecr.us-west-2.amazonaws.com/dashevo/dashdrive"
DOCKER_FILE_PATH="docker/node/Dockerfile"

docker build --build-arg NODE_ENV=development \
             --build-arg RUN_SCRIPT=api \
             --build-arg EXPOSE_PORTS=80 9229 \
             -f ${DOCKER_FILE_PATH} \
             -t ${IMAGE_TAG_PREFIX}/api \
             .

docker build --build-arg NODE_ENV=development \
             --build-arg RUN_SCRIPT=sync \
             -f ${DOCKER_FILE_PATH} \
             -t ${IMAGE_TAG_PREFIX}/sync \
             .

#docker-compose push ${IMAGE_TAG_PREFIX}/api
#docker-compose push ${IMAGE_TAG_PREFIX}/sync
