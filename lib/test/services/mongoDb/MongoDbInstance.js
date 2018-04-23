const BaseInstance = require('../docker/BaseInstance');
const MongoDbInstanceOptions = require('./MongoDbInstanceOptions');

class MongoDbInstance extends BaseInstance {
  constructor() {
    super(new MongoDbInstanceOptions());
  }
}

module.exports = MongoDbInstance;
