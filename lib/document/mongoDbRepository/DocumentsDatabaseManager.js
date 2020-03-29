class DocumentsDatabaseManager {
  /**
   * @param {createDocumentRepository} createDocumentRepository
   * @param convertToMongoDbIndices
   * @param getDocumentsDatabase
   */
  constructor(createDocumentRepository, convertToMongoDbIndices, getDocumentsDatabase) {
    this.createDocumentRepository = createDocumentRepository;
    this.convertToMongoDbIndices = convertToMongoDbIndices;
    this.getDocumentsDatabase = getDocumentsDatabase;
  }

  /**
   * Create a database for @dataContract documents
   *
   * @param {DataContract} dataContract
   * @returns {Promise<*[]>}
   */
  async create(dataContract) {
    const documentTypes = Object.keys(dataContract.getDocuments());

    const promises = documentTypes.map((documentType) => {
      const documentSchema = dataContract.getDocumentSchema(documentType);
      let indices;
      if (documentSchema.indices) {
        indices = this.convertToMongoDbIndices(documentSchema.indices);
      }

      const svDocumentRepository = this.createDocumentRepository(
        dataContract.getId(),
        documentType,
      );

      return svDocumentRepository.createCollection(indices);
    });

    return Promise.all(promises);
  }

  /**
   * Drop @dataContract database
   *
   * @param {DataContract} dataContract
   * @returns {Promise<*[]>}
   */
  async drop(dataContract) {
    return this.getDocumentsDatabase(dataContract.getId()).dropDatabase();
  }
}

module.exports = DocumentsDatabaseManager;
