#!/usr/bin/env bash

# eval $(aws ecr get-login --no-include-email)

VERSION="0.0.1"
REPO_URL="103738324493.dkr.ecr.us-west-2.amazonaws.com"
IMAGE_NAME="dashevo/dashdrive"

docker build --build-arg NODE_ENV=development \
             --build-arg NPM_TOKEN=${NPM_TOKEN} \
             -t "${REPO_URL}/${IMAGE_NAME}" \
             .

docker push "${REPO_URL}/${IMAGE_NAME}"
