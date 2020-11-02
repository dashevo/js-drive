const cbor = require('cbor');
const Long = require('long');

const ChainInfo = require('./ChainInfo');

class ChainInfoCommonStoreRepository {
  /**
   *
   * @param {CommonStore} commonStore
   */
  constructor(commonStore) {
    this.db = commonStore;
  }

  /**
   * Store chain info
   *
   * @param {ChainInfo} chainInfo
   * @return {this}
   */
  async store(chainInfo) {
    await this.db.put(
      ChainInfoCommonStoreRepository.COMMON_STORE_KEY_NAME,
      cbor.encodeCanonical(chainInfo.toJSON()),
    );

    return this;
  }

  /**
   * Fetch chain info
   *
   * @return {ChainInfo}
   */
  async fetch() {
    const chainInfoEncoded = await this.db.get(
      ChainInfoCommonStoreRepository.COMMON_STORE_KEY_NAME,
    );

    if (!chainInfoEncoded) {
      return new ChainInfo();
    }

    const {
      lastBlockHeight,
      lastBlockAppHash,
    } = cbor.decode(chainInfoEncoded);

    return new ChainInfo(
      Long.fromString(lastBlockHeight),
      lastBlockAppHash,
    );
  }
}

ChainInfoCommonStoreRepository.COMMON_STORE_KEY_NAME = Buffer.from('chainInfo');

module.exports = ChainInfoCommonStoreRepository;
