require('dotenv-expand')(require('dotenv-safe').config());

const createServer = require('@dashevo/abci');
const { onShutdown } = require('node-graceful-shutdown');

const ZMQClient = require('../lib/core/ZmqClient');

const createDIContainer = require('../lib/createDIContainer');

const { version: driveVersion } = require('../package');

(async function main() {
  const container = await createDIContainer(process.env);
  const logger = container.resolve('logger');
  const errorHandler = container.resolve('errorHandler');
  const protocolVersion = container.resolve('protocolVersion');

  logger.info(`Starting Drive ABCI application v${driveVersion} (protocol v${protocolVersion})`);

  /**
   * Ensure graceful shutdown
   */

  process
    .on('unhandledRejection', errorHandler)
    .on('uncaughtException', errorHandler);

  onShutdown('abci', async () => {
    await container.dispose();
  });

  /**
   * Make sure MongoDB is running
   */

  logger.info('Connecting to MongoDB');
  const waitReplicaSetInitialize = container.resolve('waitReplicaSetInitialize');
  await waitReplicaSetInitialize((retry, maxRetries) => {
    logger.info(
      `waiting for replica set to be initialized ${retry}/${maxRetries}...`,
    );
  });

  logger.info('Connecting to Core');

  const detectStandaloneRegtestMode = container.resolve('detectStandaloneRegtestMode');
  const isStandaloneRegtestMode = await detectStandaloneRegtestMode();

  /**
   * Make sure Core is synced
   */

  if (!isStandaloneRegtestMode) {
    const waitForCoreSync = container.resolve('waitForCoreSync');
    await waitForCoreSync((currentBlockHeight, currentHeaderNumber) => {
      let message = `waiting for core to finish sync ${currentBlockHeight}/${currentHeaderNumber}...`;

      if (currentBlockHeight === 0 && currentHeaderNumber === 0) {
        message = 'waiting for core to connect to peers...';
      }

      logger.info(message);
    });
  }

  /**
   * Connect to Core ZMQ socket
   */

  const coreZMQClient = container.resolve('coreZMQClient');

  coreZMQClient.on(ZMQClient.events.CONNECTED, () => {
    logger.debug('Connected to core ZMQ socket');
  });

  coreZMQClient.on(ZMQClient.events.DISCONNECTED, () => {
    logger.debug('Disconnected from core ZMQ socket');
  });

  coreZMQClient.on(ZMQClient.events.MAX_RETRIES_REACHED, async () => {
    const error = new Error('Can\'t connect to core ZMQ');

    await errorHandler(error);
  });

  try {
    await coreZMQClient.start();
  } catch (e) {
    const error = new Error(`Can't connect to core ZMQ socket: ${e.message}`);

    await errorHandler(error);
  }

  if (!isStandaloneRegtestMode) {
    logger.info('Obtaining the latest chain lock...');
    const waitForCoreChainLockSync = container.resolve('waitForCoreChainLockSync');
    await waitForCoreChainLockSync();
  } else {
    logger.info('Obtaining the latest core block for chain lock sync fallback...');
    const waitForCoreChainLockSyncFallback = container.resolve('waitForCoreChainLockSyncFallback');
    await waitForCoreChainLockSyncFallback();
  }

  logger.info('Waiting for initial core chain locked height...');
  const waitForChainLockedHeight = container.resolve('waitForChainLockedHeight');
  const initialCoreChainLockedHeight = container.resolve('initialCoreChainLockedHeight');
  await waitForChainLockedHeight(initialCoreChainLockedHeight);

  const server = createServer(
    container.resolve('abciHandlers'),
  );

  server.on('error', async (e) => {
    await errorHandler(e);
  });

  server.listen(
    container.resolve('abciPort'),
    container.resolve('abciHost'),
  );

  logger.info(`ABCI server is waiting for connection on port ${container.resolve('abciPort')}`);
}());
