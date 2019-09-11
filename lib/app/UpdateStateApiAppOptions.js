class UpdateStateApiAppOptions {
  constructor(options) {
    this.storageMongoDbUrl = options.STORAGE_MONGODB_URL;
    this.storageMongoDbDatabase = options.STORAGE_MONGODB_DB;
    this.gRpcHost = options.GRPC_HOST;
    this.gRpcPort = options.GRPC_PORT;
  }

  getStorageMongoDbUrl() {
    return this.storageMongoDbUrl;
  }

  getStorageMongoDbDatabase() {
    return this.storageMongoDbDatabase;
  }

  getGrpcHost() {
    return this.gRpcHost;
  }

  getGrpcPort() {
    return this.gRpcPort;
  }
}

module.exports = UpdateStateApiAppOptions;
