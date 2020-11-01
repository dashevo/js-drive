const cbor = require('cbor');
const Long = require('long');
const blake2b = require('blake2b');

const ChainInfo = require('./ChainInfo');

class ChainInfoLevelDBRepository {
  /**
   *
   * @param {LevelUP} chainInfoLevelDB
   */
  constructor(chainInfoLevelDB) {
    this.db = chainInfoLevelDB;
  }

  /**
   * Store chain info
   *
   * @param {ChainInfo} chainInfo
   * @return {this}
   */
  async store(chainInfo) {
    await this.db.put(
      ChainInfoLevelDBRepository.KEY_NAME,
      cbor.encodeCanonical(chainInfo.toJSON()),
    );

    return this;
  }

  /**
   * Get root hash
   *
   * @return {Promise<Buffer>}
   */
  async getRootHash() {
    let chainInfoEncoded;
    try {
      chainInfoEncoded = await this.db.get(
        ChainInfoLevelDBRepository.KEY_NAME,
      );
    } catch (e) {
      if (e.type !== 'NotFoundError') {
        throw e;
      }

      chainInfoEncoded = Buffer.alloc(0);
    }

    return Buffer.from(
      blake2b(32).update(chainInfoEncoded).digest(),
    );
  }

  /**
   * Fetch chain info
   *
   * @return {ChainInfo}
   */
  async fetch() {
    try {
      const chainInfoEncoded = await this.db.get(
        ChainInfoLevelDBRepository.KEY_NAME,
      );

      const {
        lastBlockHeight,
        lastBlockAppHash,
      } = cbor.decode(chainInfoEncoded);

      return new ChainInfo(
        Long.fromString(lastBlockHeight),
        lastBlockAppHash,
      );
    } catch (e) {
      if (e.type === 'NotFoundError') {
        return new ChainInfo();
      }

      throw e;
    }
  }
}

ChainInfoLevelDBRepository.KEY_NAME = Buffer.from('chainInfo');

module.exports = ChainInfoLevelDBRepository;
