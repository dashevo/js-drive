require('dotenv-expand')(require('dotenv-safe').config());

const createServer = require('abci');

const createDIContainer = require('../lib/createDIContainer');

const errorHandler = require('../lib/errorHandler');

(async function main() {
  const container = await createDIContainer(process.env);

  const logger = container.resolve('logger');

  const checkCoreSyncFinished = container.resolve('checkCoreSyncFinished');
  await checkCoreSyncFinished((currentBlockHeight, currentHeaderNumber) => {
    logger.info(
      `waiting for Core to finish sync ${currentBlockHeight}/${currentHeaderNumber}`,
    );
  });

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
