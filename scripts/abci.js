require('dotenv-expand')(require('dotenv-safe').config());

const { MongoClient } = require('mongodb');
const createServer = require('abci');

const createDIContainer = require('../lib/createDIContainer');

const errorHandler = require('../lib/errorHandler');

const waitReplicaSetInitializeFactory = require(
  '../lib/mongoDb/waitReplicaSetInitializeFactory',
);

(async function main() {
  const waitReplicaSetInitialize = waitReplicaSetInitializeFactory(MongoClient);

  await waitReplicaSetInitialize(process.env.DOCUMENT_MONGODB_URL);

  const container = await createDIContainer(process.env);

  const logger = container.resolve('logger');

  logger.info('Connecting to Core');
  const waitForCoreSync = container.resolve('waitForCoreSync');
  await waitForCoreSync((currentBlockHeight, currentHeaderNumber) => {
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

  logger.info(`Drive ABCI is listening on port ${container.resolve('abciPort')}`);
}());

process
  .on('unhandledRejection', errorHandler)
  .on('uncaughtException', errorHandler);
