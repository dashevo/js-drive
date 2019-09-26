require('dotenv-expand')(require('dotenv-safe').config());

const grpc = require('grpc');

const UpdateStateApiApp = require('../lib/app/UpdateStateApiApp');
const UpdateStateApiAppOptions = require('../lib/app/UpdateStateApiAppOptions');

const createServer = require('../lib/grpcApi/createServer');
const errorHandler = require('../lib/util/errorHandler');

(async function main() {
  const updateStateApiAppOptions = new UpdateStateApiAppOptions(process.env);
  const updateStateApiApp = new UpdateStateApiApp(updateStateApiAppOptions);

  await updateStateApiApp.init();

  const grpcServer = createServer('UpdateState', updateStateApiApp.createWrappedHandlers());
  grpcServer.bind(
    `${updateStateApiAppOptions.getGrpcHost()}:${updateStateApiAppOptions.getGrpcPort()}`,
    grpc.ServerCredentials.createInsecure(),
  );

  grpcServer.start();
}()).catch(errorHandler);
