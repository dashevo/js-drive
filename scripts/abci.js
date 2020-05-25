require('dotenv-expand')(require('dotenv-safe').config());

const createServer = require('abci');

const createDIContainer = require('../lib/createDIContainer');

const errorHandler = require('../lib/errorHandler');

(async function main() {
  const container = await createDIContainer(process.env);

  const logger = container.resolve('logger');

  logger.info('checking Core has finished syncing...');
  const checkCoreSyncFinished = container.resolve('checkCoreSyncFinished');
  await checkCoreSyncFinished((currentBlockHeight, currentHeaderNumber) => {
    logger.info(
      `currently synced ${currentBlockHeight} blocks and ${currentHeaderNumber} headers`,
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
