require('dotenv-expand')(require('dotenv-safe').config());

const path = require('path');

const grpc = require('grpc');

const { server: { createServer } } = require('@dashevo/grpc-common');

const UpdateStateApp = require('../lib/app/UpdateStateApp');
const UpdateStateAppOptions = require('../lib/app/UpdateStateAppOptions');

const errorHandler = require('../lib/util/errorHandler');

(async function main() {
  const updateStateAppOptions = new UpdateStateAppOptions(process.env);
  const updateStateApp = new UpdateStateApp(updateStateAppOptions);

  await updateStateApp.init();

  const protoPathStart = process.env.UPDATE_STATE_PROTO_PATH_START;
  const protoPathRest = [
    'node_modules',
    '@dashevo',
    'drive-grpc',
    'protos',
    'update_state.proto',
  ];

  let protoPathRoot;

  if (protoPathStart === 'root') {
    protoPathRoot = '/';
  }

  if (protoPathStart === 'cwd') {
    protoPathRoot = process.cwd();
  }

  const protoPath = path.join(
    protoPathRoot,
    ...protoPathRest,
  );

  const grpcServer = createServer(
    'org.dash.platform.drive.v0.UpdateState',
    protoPath,
    updateStateApp.createWrappedHandlers(),
  );

  grpcServer.bind(
    `${updateStateAppOptions.getGrpcHost()}:${updateStateAppOptions.getGrpcPort()}`,
    grpc.ServerCredentials.createInsecure(),
  );

  grpcServer.start();
}()).catch(errorHandler);
