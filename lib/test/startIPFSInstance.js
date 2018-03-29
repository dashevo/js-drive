const util = require('util');

const DaemonFactory = require('ipfsd-ctl');

const df = DaemonFactory.create();

const spawnIpfs = util.promisify(df.spawn).bind(df);

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
 * @param {Node[]} objects
 * @param {string} method
 * @return {Promise<[any]>}
 */
async function callParallel(objects, method) {
  const promises = objects.map(object => object[method]());
  return Promise.all(promises);
}

/**
 * Start and stop specified number of IPFS instances for mocha tests
 *
 * @param number
 * @return {Promise<IpfsAPI[]>}
 */
startIPFSInstance.many = function many(number) {
  const ipfsInstances = [];

  return new Promise(((resolve, reject) => {
    before(async function before() {
      this.timeout(number * 25 * 1000); // slow IPFS ctl

      try {
        let firstInstanceId;
        for (let i = 0; i < number; i++) {
          const ipfsd = await spawnIpfs();

          ipfsd.stop = util.promisify(ipfsd.stop).bind(ipfsd);
          ipfsd.cleanup = util.promisify(ipfsd.cleanup).bind(ipfsd);

          if (i >= 1) {
            if (!firstInstanceId) {
              const getFirstInstanceId = util.promisify(ipfsInstances[0].api.id)
                .bind(ipfsInstances[0].api);

              firstInstanceId = await getFirstInstanceId();
            }

            const connect = util.promisify(ipfsd.api.swarm.connect).bind(ipfsd.api.swarm);
            await connect(firstInstanceId.addresses[0]);
          }

          ipfsInstances.push(ipfsd);
        }
      } catch (e) {
        reject(e);

        throw e;
      }

      resolve(ipfsInstances.map(ipfsd => ipfsd.api));
    });

    afterEach(async () => {
      await callParallel(ipfsInstances, 'cleanup');
    });

    after(async () => {
      await callParallel(ipfsInstances, 'stop');
    });
  }));
};

module.exports = startIPFSInstance;
