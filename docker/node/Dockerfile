FROM 103738324493.dkr.ecr.us-west-2.amazonaws.com/dashevo/v13-node-base:latest

LABEL maintainer="Dash Developers <dev@dash.org>"
LABEL description="DashDrive Node.JS"

RUN apk update && \
    apk --no-cache upgrade && \
    apk add --no-cache bash \
                       file \
                       libunwind-dev \
                       git \
                       openssh-client \
                       python \
                       alpine-sdk \
                       zeromq-dev

# Copy project files
WORKDIR /usr/src/app
COPY . /usr/src/app
COPY .env.example /usr/src/app/.env

ENV npm_config_zmq_external=true
RUN npm install

ARG NODE_ENV=production
ARG RUN_SCRIPT
ARG EXPOSE_PORTS=9229

ENV NODE_ENV ${NODE_ENV}
ENV RUN_SCRIPT ${RUN_SCRIPT}

EXPOSE ${EXPOSE_PORTS}

CMD npm run ${RUN_SCRIPT}
