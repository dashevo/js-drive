const util = require('util');

// eslint-disable-next-line import/no-extraneous-dependencies
const DaemonFactory = require('ipfsd-ctl');
const IPFSApi = require('ipfs-api');

const df = DaemonFactory.create({ type: 'go' });

const spawn = util.promisify(df.spawn).bind(df);

module.exports = function startIPFSInstance() {
  let stop = null;

  return new Promise(((resolve) => {
    before(async function before() {
      this.timeout(20 * 1000); // slow Ctl

      const ipfsd = await spawn();
      stop = util.promisify(ipfsd.stop).bind(ipfsd);

      resolve(new IPFSApi(ipfsd.apiAddr));
    });

    after(async () => {
      if (stop !== null) {
        await stop();
      }
    });
  }));
};
