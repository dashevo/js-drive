class DocumentStoreRepository {
  /**
   *
   * @param {MerkDbStore} documentsStore
   * @param {DashPlatformProtocol} noStateDpp
   */
  constructor(documentsStore, noStateDpp) {
    this.storage = documentsStore;
    this.dpp = noStateDpp;
  }

  /**
   * Store document
   *
   * @param {Document} document
   * @param {MerkDbTransaction} [transaction]
   * @return {Promise<IdentityStoreRepository>}
   */
  async store(document, transaction = undefined) {
    this.storage.put(
      document.getId(),
      document.toBuffer(),
      transaction,
    );
  }

  /**
   * Fetch document by id
   *
   * @param {Identifier} id
   * @param {MerkDbTransaction} [transaction]
   * @return {Promise<null|Document>}
   */
  async fetch(id, transaction = undefined) {
    const encodedDocument = this.storage.get(id, transaction);

    if (!encodedDocument) {
      return null;
    }

    return this.dpp.document.createFromBuffer(
      encodedDocument,
      { skipValidation: true },
    );
  }
}

module.exports = DocumentStoreRepository;
