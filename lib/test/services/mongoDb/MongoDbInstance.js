const DockerInstance = require('../docker/DockerInstance');

class MongoDbInstance extends DockerInstance {
  /**
   * Create DashCore instance
   *
   * @param {Network} network
   * @param {Image} image
   * @param {Container} container
   * @param {MongoClient} MongoClient
   * @param {MongoDbInstanceOptions} options
   */
  constructor(network, image, container, MongoClient, options) {
    super(network, image, container, options);
    this.MongoClient = MongoClient;
    this.options = options;
  }

  /**
   * Close MongoDb connection and remove container
   *
   * @return {Promise<void>}
   */
  async clean() {
    if (this.mongoClient) {
      await this.mongoClient.close();
    }

    await super.remove();
  }

  /**
   * Get Mongo client
   *
   * @return {Db}
   */
  async getMongoClient() {
    if (!this.isInitialized()) {
      return {};
    }
    if (this.mongoClient) {
      return this.mongoClient.db(this.options.mongo.name);
    }

    this.mongoClient = await this.connectToMongo();
    return this.mongoClient.db(this.options.mongo.name);
  }

  /**
   * @private
   *
   * @returns {Promise<MongoClient>}
   */
  async connectToMongo() {
    try {
      const address = `mongodb://127.0.0.1:${this.options.mongo.port}`;
      return await this.MongoClient.connect(address);
    } catch (error) {
      if (error.name !== 'MongoNetworkError') {
        throw error;
      }
      return this.connectToMongo();
    }
  }
}

module.exports = MongoDbInstance;
