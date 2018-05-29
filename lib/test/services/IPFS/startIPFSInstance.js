const createIPFSInstance = require('./createIPFSInstance');

/**
 * Start and stop IPFS instance for mocha tests
 *
 * @return {Promise<IpfsAPI>}
 */
async function startIPFSInstance() {
  const ipfsAPIs = await startIPFSInstance.many(1);

  return ipfsAPIs[0];
}

/**
 * Start and stop specified number of IPFS instances for mocha tests
 *
 * @param number
 * @return {Promise<IpfsAPI[]>}
 */
startIPFSInstance.many = async function many(number) {
  if (number < 1) {
    throw new Error('Invalid number of instances');
  }

  const instances = [];

  for (let i = 0; i < number; i++) {
    const instance = await createIPFSInstance();
    await instance.start();
    instances.push(instance);
  }

  return instances;
};

module.exports = startIPFSInstance;
