const Docker = require('dockerode');

async function removeContainer() {
  const docker = new Docker();
  const containers = await docker.listContainers();
  containers.forEach(async (containerInfo) => {
    if (containerInfo.Labels.service === 'DashDockerTestHelperContainer') {
      await docker.getContainer(containerInfo.Id).stop();
      await docker.getContainer(containerInfo.Id).remove();
    }
  });
}

module.exports = removeContainer;
