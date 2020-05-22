require('dotenv-expand')(require('dotenv-safe').config());

const createServer = require('abci');

const createDIContainer = require('../lib/createDIContainer');

const errorHandler = require('../lib/errorHandler');

(async function main() {
  const container = await createDIContainer(process.env);

  const checkCoreSyncFinished = container.resolve('checkCoreSyncFinished');
  await checkCoreSyncFinished();

  const server = createServer(
    container.resolve('abciHandlers'),
  );

  server.listen(
    container.resolve('abciPort'),
    container.resolve('abciHost'),
  );
}());

process
  .on('unhandledRejection', errorHandler)
  .on('uncaughtException', errorHandler);
