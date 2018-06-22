/**
 * @param {MongoClient} mongoClient
 * @returns {dropDriveMongoDatabases}
 */
function dropDriveMongoDatabasesFactory(mongoClient) {
  /**
   * Drop all DashDrive MongoDB databases
   *
   * @typedef {Promise} dropDriveMongoDatabases
   * @returns {Promise<void>}
   */
  async function dropDriveMongoDatabases() {
    const { databases: dbs } = await mongoClient.db().admin().listDatabases();
    const dbStartingBy = prefix => db => db.name.includes(prefix);
    const driveDatabases = dbs.filter(dbStartingBy('drive_'));

    for (let index = 0; index < driveDatabases.length; index++) {
      const db = driveDatabases[index];
      await mongoClient.db(db.name).dropDatabase();
    }
  }

  return dropDriveMongoDatabases;
}

module.exports = dropDriveMongoDatabasesFactory;
