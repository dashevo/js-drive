const Identifier = require("@dashevo/dpp/lib/identifier/Identifier");
const IdentifierError = require("@dashevo/dpp/lib/identifier/errors/IdentifierError");
const InvalidContractIdError = require("./query/errors/InvalidContractIdError");

class DocumentIndexedStoreRepository {
  /**
   *
   * @param {DocumentStoreRepository} documentStoreRepository
   * @param {createDocumentMongoDbRepository} createDocumentIndicesRepository
   */
  constructor(documentStoreRepository, createDocumentIndicesRepository) {
    this.documentStoreRepository = documentStoreRepository;
    this.createDocumentIndicesRepository = createDocumentIndicesRepository;
  }

  /**
   * Store document
   *
   * @param {Document} document
   * @param {DocumentDbTransaction} [transaction]
   * @return {Promise<void>}
   */
  async store(document, transaction = undefined) {
    await this.documentStoreRepository.store(document, transaction.getStoreTransaction());

    const indicesRepository = await this.createDocumentIndicesRepository(
      document.getDataContractId(),
      document.getType(),
    );

    await indicesRepository.store(document, transaction.getMongoDbTransaction());
  }

  /**
   * Fetch document by ID
   *
   * @param {Identifier} id
   * @param {DocumentDbTransaction} [transaction]
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
   * @param {MongoDBTransaction} [transaction]
   * @return {Promise<Document[]>}
   */
  async find(dataContractId, documentType, query = {}, transaction = undefined) {
    const indicesRepository = await this.createDocumentIndicesRepository(
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
   * @param {MongoDBTransaction} [transaction]
   * @return {Promise<Document[]>}
   */
  async delete(dataContractId, documentType, documentId, transaction) {
    const indicesRepository = await this.createDocumentIndicesRepository(
      dataContractId,
      documentType,
    );

    await indicesRepository.delete(documentId, transaction);
    await this.documentStoreRepository.delete(documentId);
  }
}

module.exports = DocumentIndexedStoreRepository;
