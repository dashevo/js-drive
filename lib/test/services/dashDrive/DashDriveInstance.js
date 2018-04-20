const BaseInstance = require('../../instance/BaseInstance');
const DashDriveInstanceOptions = require('./DashDriveInstanceOptions');

class DashDriveInstance extends BaseInstance {
  constructor({ ENV = {} } = {}) {
    super(new DashDriveInstanceOptions({ envs: ENV }));
  }
}

module.exports = DashDriveInstance;
