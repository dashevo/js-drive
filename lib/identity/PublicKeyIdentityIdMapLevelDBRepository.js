const LevelDbTransaction = require('../levelDb/LevelDBTransaction');

class PublicKeyIdentityIdMapLevelDBRepository {
  /**
   *
   * @param {LevelUP} identityLevelDB
   */
  constructor(identityLevelDB) {
    this.db = identityLevelDB;
  }

  /**
   * Store public key to identity id map into database
   *
   * @param {Buffer} publicKeyHash
   * @param {Buffer} identityId
   * @param {LevelDBTransaction} [transaction]
   *
   * @return {Promise<PublicKeyIdentityIdMapLevelDBRepository>}
   */
  async store(publicKeyHash, identityId, transaction = undefined) {
    const db = transaction ? transaction.db : this.db;

    await db.put(
      this.addKeyPrefix(publicKeyHash.toString('base64')),
      identityId,
      { asBuffer: true },
    );

    return this;
  }

  /**
   * Fetch identity id by public key hash from database
   *
   * @param {string} publicKeyHashString
   * @param {LevelDBTransaction} [transaction]
   *
   * @return {Promise<null|Buffer>}
   */
  async fetch(publicKeyHashString, transaction = undefined) {
    const db = transaction ? transaction.db : this.db;

    try {
      // do not remove await
      return await db.get(
        this.addKeyPrefix(publicKeyHashString),
      );
    } catch (e) {
      if (e.type === 'NotFoundError') {
        return null;
      }

      throw e;
    }
  }

  /**
   * Get DB key by public key hash
   *
   * @private
   * @param {string} publicKeyHash
   * @return {string}
   */
  addKeyPrefix(publicKeyHash) {
    return `${PublicKeyIdentityIdMapLevelDBRepository.KEY_PREFIX}:${publicKeyHash}`;
  }

  /**
   * Creates new transaction instance
   *
   * @return {LevelDBTransaction}
   */
  createTransaction() {
    return new LevelDbTransaction(this.db);
  }
}

PublicKeyIdentityIdMapLevelDBRepository.KEY_PREFIX = 'publicKeyIdentityId';

module.exports = PublicKeyIdentityIdMapLevelDBRepository;
