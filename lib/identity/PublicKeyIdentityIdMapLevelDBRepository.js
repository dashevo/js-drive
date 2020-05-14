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
   * @param {string} publicKey
   * @param {string} identityId
   * @param {LevelDBTransaction} [transaction]
   *
   * @return {Promise<PublicKeyIdentityIdMapLevelDBRepository>}
   */
  async store(publicKey, identityId, transaction = undefined) {
    const db = transaction ? transaction.db : this.db;

    await db.put(
      this.addKeyPrefix(publicKey),
      identityId,
    );

    return this;
  }

  /**
   * Fetch identity id by public key from database
   *
   * @param {string} publicKey
   * @param {LevelDBTransaction} [transaction]
   *
   * @return {Promise<null|string>}
   */
  async fetch(publicKey, transaction = undefined) {
    const db = transaction ? transaction.db : this.db;

    try {
      const identityId = await db.get(
        this.addKeyPrefix(publicKey),
      );

      return identityId.toString();
    } catch (e) {
      if (e.type === 'NotFoundError') {
        return null;
      }

      throw e;
    }
  }

  /**
   * Get DB key by public key
   *
   * @private
   * @param {string} publicKey
   * @return {string}
   */
  addKeyPrefix(publicKey) {
    return `${PublicKeyIdentityIdMapLevelDBRepository.KEY_PREFIX}:${publicKey}`;
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

PublicKeyIdentityIdMapLevelDBRepository.KEY_PREFIX = 'publicKeyIdentityId:';

module.exports = PublicKeyIdentityIdMapLevelDBRepository;
