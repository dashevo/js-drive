const ReplicaSetInitError = require('./errors/ReplicaSetInitError');

/**
 *
 * @param {MongoClient} documentsMongoDBClient
 * @return {Promise<void>}
 */
async function checkReplicaSetInit(documentsMongoDBClient) {
  const status = await documentsMongoDBClient.db('test')
    .admin()
    .command({ replSetGetStatus: 1 });

  if (!status) {
    throw new ReplicaSetInitError('Replica set status is empty', status);
  }

  if (!status.members || !status.members[0]) {
    throw new ReplicaSetInitError('Replica set have no members', status);
  }

  if (status.members[0].stateStr !== 'PRIMARY') {
    throw new ReplicaSetInitError('Replica set member is not in PRIMARY state', status);
  }
}

module.exports = checkReplicaSetInit;
