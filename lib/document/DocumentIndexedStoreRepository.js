class DocumentIndexedStoreRepository {
  /**
   *
   * @param {DocumentStoreRepository} documentStoreRepository
   * @param {createDocumentMongoDbRepository} createDocumentMongoDbRepository
   */
  constructor(documentStoreRepository, createDocumentMongoDbRepository) {
    this.documentStoreRepository = documentStoreRepository;
    this.createDocumentMongoDbRepository = createDocumentMongoDbRepository;
  }

  /**
   * Store document
   *
   * @param {Document} document
   * @param {DocumentsDbTransaction} [transaction]
   * @return {Promise<void>}
   */
  async store(document, transaction = undefined) {
    await this.documentStoreRepository.store(document, transaction.getStoreTransaction());

    const indicesRepository = await this.createDocumentMongoDbRepository(
      document.getDataContractId(),
      document.getType(),
    );

    await indicesRepository.store(document, transaction.getMongoDbTransaction());
  }

  /**
   * Fetch document by ID
   *
   * @param {Identifier} id
   * @param {DocumentsDbTransaction} [transaction]
   * @return {Promise<Document|null>}
   */
  async fetch(id, transaction = undefined) {
    return this.documentStoreRepository.fetch(id, transaction.getStoreTransaction());
  }

  /**
   * Find documents by query
   *
   * @param {Identifier|Buffer} dataContractId
   * @param {string} documentType
   * @param [query]
   * @param [query.where]
   * @param [query.limit]
   * @param [query.startAt]
   * @param [query.startAfter]
   * @param [query.orderBy]
   * @param {DocumentsDbTransaction} [transaction]
   * @return {Promise<Document[]>}
   */
  async find(dataContractId, documentType, query = {}, transaction = undefined) {
    const indicesRepository = await this.createDocumentMongoDbRepository(
      dataContractId,
      documentType,
    );

    const documentIds = indicesRepository.find(query, transaction.getMongoDbTransaction());

    return documentIds.map((id) => (
      this.documentStoreRepository.fetch(id, transaction.getStoreTransaction())
    ));
  }

  /**
   * Find documents by query
   *
   * @param {Identifier} dataContractId
   * @param {string} documentType
   * @param {Identifier} documentId
   * @param {DocumentsDbTransaction} [transaction]
   * @return {Promise<Document[]>}
   */
  async delete(dataContractId, documentType, documentId, transaction) {
    const indicesRepository = await this.createDocumentMongoDbRepository(
      dataContractId,
      documentType,
    );

    await indicesRepository.delete(documentId, transaction.getMongoDbTransaction());

    await this.documentStoreRepository.delete(documentId, transaction.getStoreTransaction());
  }
}

module.exports = DocumentIndexedStoreRepository;
