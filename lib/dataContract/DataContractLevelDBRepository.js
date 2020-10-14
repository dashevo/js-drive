const Identifier = require('@dashevo/dpp/lib/Identifier');
const LevelDbTransaction = require('../levelDb/LevelDBTransaction');

class DataContractLevelDBRepository {
  /**
   *
   * @param {LevelUP} dataContractLevelDB
   * @param {DashPlatformProtocol} noStateDpp
   */
  constructor(dataContractLevelDB, noStateDpp) {
    this.db = dataContractLevelDB;
    this.dpp = noStateDpp;
  }

  /**
   * Store Data Contract into database
   *
   * @param {DataContract} dataContract
   * @param {LevelDBTransaction} [transaction]
   * @return {Promise<DataContractLevelDBRepository>}
   */
  async store(dataContract, transaction = undefined) {
    const db = transaction ? transaction.db : this.db;

    await db.put(
      dataContract.getId(),
      dataContract.toBuffer(),
      { asBuffer: true },
    );

    return this;
  }

  /**
   * Fetch Data Contract by ID from database
   *
   * @param {Buffer} id
   * @param {LevelDBTransaction} [transaction]
   * @return {Promise<null|DataContract>}
   */
  async fetch(id, transaction = undefined) {
    const db = transaction ? transaction.db : this.db;

    try {
      const encodedDataContract = await db.get(
        new Identifier(id),
      );

      return this.dpp.dataContract.createFromBuffer(
        encodedDataContract,
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
   * Creates new transaction instance
   *
   * @return {LevelDBTransaction}
   */
  createTransaction() {
    return new LevelDbTransaction(this.db);
  }
}

module.exports = DataContractLevelDBRepository;
