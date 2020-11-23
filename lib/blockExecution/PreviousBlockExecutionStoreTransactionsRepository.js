const cbor = require('cbor');
const BlockExecutionStoreTransactions = require('./BlockExecutionStoreTransactions');

class PreviousBlockExecutionStoreTransactionsRepository {
  /**
   * @param {FileDb} previousBlockExecutionTransactionDB
   * @param {MerkDbStore} previousCommonStore
   * @param {MerkDbStore} previousIdentitiesStore
   * @param {MerkDbStore} previousDocumentsStore
   * @param {MerkDbStore} previousDataContractsStore
   * @param {MerkDbStore} previousPublicKeyToIdentityIdStore
   * @param {connectToDocumentMongoDB} previousConnectToDocumentMongoDB
   */
  constructor(
    previousBlockExecutionTransactionDB,
    previousCommonStore,
    previousIdentitiesStore,
    previousDocumentsStore,
    previousDataContractsStore,
    previousPublicKeyToIdentityIdStore,
    previousConnectToDocumentMongoDB,
  ) {
    this.blockExecutionTransactionDB = previousBlockExecutionTransactionDB;

    this.commonStore = previousCommonStore;
    this.identitiesStore = previousIdentitiesStore;
    this.documentsStore = previousDocumentsStore;
    this.dataContractsStore = previousDataContractsStore;
    this.publicKeyToIdentityIdStore = previousPublicKeyToIdentityIdStore;
    this.connectToDocumentMongoDB = previousConnectToDocumentMongoDB;
  }

  /**
   * @param {BlockExecutionStoreTransactions} storeTransactions
   *
   * @return {void}
   */
  async store(storeTransactions) {
    if (!storeTransactions.isStarted()) {
      throw new Error('is not started');
    }

    const serializedTransactions = cbor.encode(storeTransactions.toObject());

    await this.blockExecutionTransactionDB.set(serializedTransactions);
  }

  /**
   * Fetch BlockExecutionStoreTransactions
   *
   * @return {BlockExecutionStoreTransactions|null}
   */
  async fetch() {
    const serializedTransactions = await this.blockExecutionTransactionDB.get();

    if (!serializedTransactions) {
      return null;
    }

    const newBlockExecutionStoreTransactions = new BlockExecutionStoreTransactions(
      this.commonStore,
      this.identitiesStore,
      this.documentsStore,
      this.dataContractsStore,
      this.publicKeyToIdentityIdStore,
      this.connectToDocumentMongoDB,
    );

    await newBlockExecutionStoreTransactions.start();

    const plainObjectTransactions = cbor.decode(serializedTransactions);

    await newBlockExecutionStoreTransactions.populateFromObject(plainObjectTransactions);

    return newBlockExecutionStoreTransactions;
  }

  /**
   * Clear DB state
   *
   * @return {void}
   */
  async clear() {
    await this.blockExecutionTransactionDB.clear();
  }
}

module.exports = PreviousBlockExecutionStoreTransactionsRepository;
