const Docker = require('dockerode');

describe('Docker', () => {
  it('should connect to daemon', async () => {
    const docker = new Docker();
    const containers = await docker.listContainers();
    console.dir(containers);
    docker.pull();
  });
});
