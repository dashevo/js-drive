const MongoDBTransaction = require('../mongoDb/MongoDBTransaction');
const DocumentsIndexedTransaction = require('../document/DocumentsIndexedTransaction');
const BlockExecutionStoreTransactionIsAlreadyStartedError = require('./errors/BlockExecutionStoreTransactionIsAlreadyStartedError');
const BlockExecutionStoreTransactionIsNotStartedError = require('./errors/BlockExecutionStoreTransactionIsNotStartedError');
const BlockExecutionStoreTransactionIsNotDefinedError = require('./errors/BlockExecutionStoreTransactionIsNotDefinedError');

class BlockExecutionStoreTransactions {
  /**
   *
   * @param {MerkDbStore} commonStore
   * @param {MerkDbStore} identitiesStore
   * @param {MerkDbStore} documentsStore
   * @param {MerkDbStore} dataContractsStore
   * @param {MerkDbStore} publicKeyToIdentityIdStore
   * @param {connectToMongoDB} connectToDocumentMongoDB
   * @param {populateMongoDbTransactionFromObject} populateMongoDbTransactionFromObject
   */
  constructor(
    commonStore,
    identitiesStore,
    documentsStore,
    dataContractsStore,
    publicKeyToIdentityIdStore,
    connectToDocumentMongoDB,
    populateMongoDbTransactionFromObject,
  ) {
    const documentsTransaction = new DocumentsIndexedTransaction(
      documentsStore.createTransaction(),
      new MongoDBTransaction(connectToDocumentMongoDB),
      populateMongoDbTransactionFromObject,
    );

    this.commonStore = commonStore;
    this.identitiesStore = identitiesStore;
    this.documentsStore = documentsStore;
    this.dataContractsStore = dataContractsStore;
    this.publicKeyToIdentityIdStore = publicKeyToIdentityIdStore;
    this.connectToDocumentMongoDB = connectToDocumentMongoDB;
    this.populateMongoDbTransactionFromObject = populateMongoDbTransactionFromObject;

    this.transactions = {
      common: commonStore.createTransaction(),
      identities: identitiesStore.createTransaction(),
      documents: documentsTransaction,
      dataContracts: dataContractsStore.createTransaction(),
      publicKeyToIdentityId: publicKeyToIdentityIdStore.createTransaction(),
    };

    this.isTransactionsStarted = false;
  }

  /**
   * Start transactions
   */
  async start() {
    if (this.isTransactionsStarted) {
      throw new BlockExecutionStoreTransactionIsAlreadyStartedError();
    }

    await Promise.all(
      Object.values(this.transactions).map((t) => t.start()),
    );

    this.isTransactionsStarted = true;
  }

  /**
   * Commit transactions
   *
   * @return {Promise<void>}
   */
  async commit() {
    if (!this.isTransactionsStarted) {
      throw new BlockExecutionStoreTransactionIsNotStartedError();
    }

    await Promise.all(
      Object
        .values(this.transactions)
        .map((transaction) => transaction.commit()),
    );
  }

  /**
   * Abort transactions
   *
   * @return {Promise<void>}
   */
  async abort() {
    if (!this.isTransactionsStarted) {
      throw new BlockExecutionStoreTransactionIsNotStartedError();
    }

    await Promise.all(
      Object
        .values(this.transactions)
        .map((transaction) => transaction.abort()),
    );
  }

  /**
   * Are transactions started
   *
   * @returns {boolean}
   */
  isStarted() {
    return this.isTransactionsStarted;
  }

  /**
   * Get transaction by name
   *
   * @return {MerkDbTransaction|MongoDBTransaction}
   */
  getTransaction(name) {
    if (!this.transactions[name]) {
      throw new BlockExecutionStoreTransactionIsNotDefinedError(name);
    }

    return this.transactions[name];
  }

  /**
   * Return transactions as plain objects
   *
   * @return {RawStoreTransaction}
   */
  toObject() {
    return Object.entries(this.transactions)
      .reduce((transactions, [name, transaction]) => (
        {
          ...transactions,
          [name]: transaction.toObject(),
        }
      ), {});
  }

  /**
   * Populate transactions from transactions object
   *
   * @param {RawStoreTransaction} transactionsObject
   */
  async populateFromObject(transactionsObject) {
    for (const name of Object.keys(transactionsObject)) {
      await this.transactions[name].populateFromObject(transactionsObject[name]);
    }
  }

  /**
   * Clone db transactions
   *
   * @returns {BlockExecutionStoreTransactions}
   */
  async clone() {
    const newBlockExecutionStoreTransactions = new BlockExecutionStoreTransactions(
      this.commonStore,
      this.identitiesStore,
      this.documentsStore,
      this.dataContractsStore,
      this.publicKeyToIdentityIdStore,
      this.connectToDocumentMongoDB,
      this.populateMongoDbTransactionFromObject,
    );

    await newBlockExecutionStoreTransactions.start();

    await newBlockExecutionStoreTransactions.populateFromObject(this.toObject());

    return newBlockExecutionStoreTransactions;
  }
}

/**
 * @typedef {Object} RawStoreTransaction
 * @property {Object} updates
 * @property {Object} deletes
 */

/**
 * @typedef {Object} RawBlockExecutionStoreTransactions
 * @property {RawStoreTransaction} common
 * @property {RawStoreTransaction} identities
 * @property {RawStoreTransaction} documents
 * @property {RawStoreTransaction} dataContracts
 * @property {RawStoreTransaction} publicKeyToIdentityId
 */

module.exports = BlockExecutionStoreTransactions;
