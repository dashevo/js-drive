console.log('updateState before');
require('dotenv-expand')(require('dotenv-safe').config());

const grpc = require('grpc');

const { server: { createServer } } = require('@dashevo/grpc-common');
const { getUpdateStateDefinition } = require('@dashevo/drive-grpc');

const UpdateStateApp = require('../lib/app/UpdateStateApp');
const UpdateStateAppOptions = require('../lib/app/UpdateStateAppOptions');

const errorHandler = require('../lib/util/errorHandler');

console.log('Starting updateState');
(async function main() {
  console.log('updateState creating app');
  const updateStateAppOptions = new UpdateStateAppOptions(process.env);
  const updateStateApp = new UpdateStateApp(updateStateAppOptions);
  console.log('updateState initializing');
  await updateStateApp.init();
  console.log('updateState initialized');
  const grpcServer = createServer(
    getUpdateStateDefinition(),
    updateStateApp.createWrappedHandlers(),
  );
  console.log('updateState', 'server created');
  grpcServer.bind(
    `${updateStateAppOptions.getGrpcHost()}:${updateStateAppOptions.getGrpcPort()}`,
    grpc.ServerCredentials.createInsecure(),
  );
  console.log('updateState', `${updateStateAppOptions.getGrpcHost()}:${updateStateAppOptions.getGrpcPort()}`);
  grpcServer.start();
  console.log('updateState started');
}()).catch(errorHandler);
