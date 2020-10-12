const LevelDbTransaction = require('../levelDb/LevelDBTransaction');

class IdentityLevelDBRepository {
  /**
   *
   * @param {LevelUP} identityLevelDB
   * @param {DashPlatformProtocol} noStateDpp
   */
  constructor(identityLevelDB, noStateDpp) {
    this.db = identityLevelDB;
    this.dpp = noStateDpp;
  }

  /**
   * Store identity into database
   *
   * @param {Identity} identity
   * @param {LevelDBTransaction} [transaction]
   * @return {Promise<IdentityLevelDBRepository>}
   */
  async store(identity, transaction = undefined) {
    const db = transaction ? transaction.db : this.db;

    await db.put(
      this.addKeyPrefix(identity.getId().toString()),
      identity.toBuffer(),
      { asBuffer: true },
    );

    return this;
  }

  /**
   * Fetch identity by id from database
   *
   * @param {string} idString
   * @param {LevelDBTransaction} [transaction]
   * @return {Promise<null|Identity>}
   */
  async fetch(idString, transaction = undefined) {
    const db = transaction ? transaction.db : this.db;

    try {
      const encodedIdentity = await db.get(
        this.addKeyPrefix(idString),
      );

      return this.dpp.identity.createFromBuffer(
        encodedIdentity,
        { skipValidation: true },
      );
    } catch (e) {
      if (e.type === 'NotFoundError') {
        return null;
      }

      throw e;
    }
  }

  /**
   * Get DB key by identity id
   *
   * @private
   * @param {string} id
   * @return {string}
   */
  addKeyPrefix(id) {
    return `${IdentityLevelDBRepository.KEY_PREFIX}:${id}`;
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

IdentityLevelDBRepository.KEY_PREFIX = 'identity';

module.exports = IdentityLevelDBRepository;
