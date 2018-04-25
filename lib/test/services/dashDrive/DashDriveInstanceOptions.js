const Options = require('../docker/Options');

class DashDriveInstanceOptions extends Options {
  constructor({ envs }) {
    super();

    const container = {
      image: '103738324493.dkr.ecr.us-west-2.amazonaws.com/dashevo/dashdrive',
      envs,
      cmd: [
        'npm',
        'run',
        'sync',
      ],
      network: {
        name: 'dash_test_network',
        driver: 'bridge',
      },
    };
    this.container = Object.assign({}, this.container, container);
  }
}

module.exports = DashDriveInstanceOptions;
