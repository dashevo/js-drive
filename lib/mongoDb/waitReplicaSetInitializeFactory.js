const wait = require('../util/wait');

const ReplicaSetIsNotInitializedError = require('./errors/ReplicaSetIsNotInitializedError');

/**
 *
 * @param {connectToMongoDB} connectToMongoDB
 * @return {waitReplicaSetInitialize}
 */
function waitReplicaSetInitializeFactory(connectToMongoDB) {
  /**
   * Wait until mongoDB replica set to be initialized
   * @typedef waitReplicaSetInitialize
   * @return {Promise<void>}
   */
  async function waitReplicaSetInitialize() {
    let lastError;
    let isInitialized = false;
    let currentTime = new Date().getTime();

    const maxTime = currentTime + 60000; // ~1 minute

    while (!isInitialized && currentTime < maxTime) {
      try {
        const mongoClient = await connectToMongoDB();

        const status = await mongoClient.db('test')
          .admin()
          .command({ replSetGetStatus: 1 });

        isInitialized = status && status.members && status.members[0] && status.members[0].stateStr === 'PRIMARY';
      } catch (e) {
        // skip the error
        lastError = e;
      } finally {
        if (!isInitialized) {
          currentTime = new Date().getTime();

          await wait(1000);
        }
      }
    }

    if (!isInitialized) {
      throw new ReplicaSetIsNotInitializedError(lastError);
    }
  }

  return waitReplicaSetInitialize;
}

module.exports = waitReplicaSetInitializeFactory;
