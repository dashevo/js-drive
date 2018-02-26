const IpfsAPI = require('ipfs-api');

module.exports = new IpfsAPI(process.env.STORAGE_IPFS_MULTIADDR);
