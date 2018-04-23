const Options = require('../docker/Options');

class DashDriveInstanceOptions extends Options {
  constructor({ envs }) {
    super();

    this.image = {
      name: '103738324493.dkr.ecr.us-west-2.amazonaws.com/dashevo/dashdrive',
      authorization: true,
    };
    this.envs = envs;
    this.cmd = [
      'npm',
      'run',
      'sync',
    ];
    this.ports = {};
    this.network = {
      name: 'dash_test_network',
      driver: 'bridge',
    };
  }
}

module.exports = DashDriveInstanceOptions;
