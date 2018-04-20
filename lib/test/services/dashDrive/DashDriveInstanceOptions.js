class DashDriveInstanceOptions {
  constructor({ envs }) {
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
      driver: 'brigde',
    };
  }

  generate() {
    return this;
  }
}

module.exports = DashDriveInstanceOptions;
