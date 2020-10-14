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
      publicKeyHash.toString('hex'),
      identityId,
      { asBuffer: true },
    );

    return this;
  }

  /**
   * Fetch identity id by public key hash from database
   *
   * @param {Buffer} publicKeyHash
   * @param {LevelDBTransaction} [transaction]
   *
   * @return {Promise<null|Buffer>}
   */
  async fetch(publicKeyHash, transaction = undefined) {
    const db = transaction ? transaction.db : this.db;

    try {
      // do not remove await
      return await db.get(publicKeyHash.toString('hex'));
    } catch (e) {
      if (e.type === 'NotFoundError') {
        return null;
      }

      throw e;
    }
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

module.exports = PublicKeyIdentityIdMapLevelDBRepository;
