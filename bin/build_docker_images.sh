#! /bin/bash

# 0. authenticate your Docker client to your registry:
eval $(aws ecr get-login --no-include-email)

docker-compose build
docker-compose push
