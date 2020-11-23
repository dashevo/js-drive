const cbor = require('cbor');
const Long = require('long');

const ChainInfo = require('./ChainInfo');

class ChainInfoCommonStoreRepository {
  /**
   *
   * @param {MerkDbStore} commonStore
   */
  constructor(commonStore) {
    this.storage = commonStore;
  }

  /**
   * Store chain info
   *
   * @param {ChainInfo} chainInfo
   * @param {MerkDbTransaction} transaction
   * @return {this}
   */
  async store(chainInfo, transaction = undefined) {
    await this.storage.put(
      ChainInfoCommonStoreRepository.COMMON_STORE_KEY_NAME,
      cbor.encodeCanonical(chainInfo.toJSON()),
      transaction,
    );

    return this;
  }

  /**
   * Fetch chain info
   *
   * @param {MerkDbTransaction} transaction
   *
   * @return {ChainInfo}
   */
  async fetch(transaction = undefined) {
    const chainInfoEncoded = await this.storage.get(
      ChainInfoCommonStoreRepository.COMMON_STORE_KEY_NAME,
      transaction,
    );

    if (!chainInfoEncoded) {
      return new ChainInfo();
    }

    const {
      lastBlockHeight,
    } = cbor.decode(chainInfoEncoded);

    return new ChainInfo(
      Long.fromString(lastBlockHeight),
    );
  }
}

ChainInfoCommonStoreRepository.COMMON_STORE_KEY_NAME = Buffer.from('chainInfo');

module.exports = ChainInfoCommonStoreRepository;
