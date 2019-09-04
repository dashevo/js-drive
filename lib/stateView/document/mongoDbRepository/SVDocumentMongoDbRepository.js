const Document = require('@dashevo/dpp/lib/document/Document');

const SVDocument = require('../SVDocument');
const Reference = require('../../revisions/Reference');

const convertFieldName = require('./convertFieldName');

const createRevisions = require('../../revisions/createRevisions');

const InvalidQueryError = require('../errors/InvalidQueryError');

class SVDocumentMongoDbRepository {
  /**
   * @param {Db} mongoClient
   * @param {convertWhereToMongoDbQuery} convertWhereToMongoDbQuery
   * @param {validateQuery} validateQuery
   * @param {string} documentType
   */
  constructor(mongoClient, convertWhereToMongoDbQuery, validateQuery, documentType) {
    this.convertWhereToMongoDbQuery = convertWhereToMongoDbQuery;
    this.validateQuery = validateQuery;
    this.documentType = documentType;
    this.dbName = mongoClient.databaseName;
    this.collectionName = this.getCollectionName();
    this.mongoClient = mongoClient.collection(this.collectionName);
  }

  /**
   * Returns mongoDatabase collection name
   *
   * @private
   * @returns {string}
   */
  getCollectionName() {
    return `documents_${this.documentType}`;
  }

  /**
   * Find SVDocument by id
   *
   * @param {string} id
   * @param {MongoDBTransaction} [dbTransaction]
   * @returns {Promise<SVDocument>}
   */
  async find(id, dbTransaction) {
    const findQuery = { _id: id };

    let result;
    if (dbTransaction) {
      const transactionFunction = async (mongoClient, session) => mongoClient
        .db(this.dbName)
        .collection(this.collectionName)
        .findOne(findQuery, { session });

      result = await dbTransaction.runWithTransaction(transactionFunction);
    } else {
      result = await this.mongoClient.findOne(findQuery);
    }

    if (!result) {
      return null;
    }

    return this.createSVDocument(result);
  }

  /**
   * Find all documents by `reference.stHash`
   *
   * @param {string} stHash
   * @param {MongoDBTransaction} [dbTransaction]
   * @returns {Promise<SVDocument[]>}
   */
  async findAllBySTHash(stHash, dbTransaction) {
    const findQuery = { 'reference.stHash': stHash };
    let result;
    if (dbTransaction) {
      const transactionFunction = async (mongoClient, session) => mongoClient
        .db(this.dbName)
        .collection(this.collectionName)
        .find(findQuery, { session })
        .toArray();

      result = await dbTransaction.runWithTransaction(transactionFunction);
    } else {
      result = await this.mongoClient
        .find(findQuery)
        .toArray();
    }

    return result.map(rawDocument => this.createSVDocument(rawDocument));
  }

  /**
   * Fetch SVDocuments
   *
   * @param [query]
   * @param [query.where]
   * @param [query.limit]
   * @param [query.startAt]
   * @param [query.startAfter]
   * @param [query.orderBy]
   * @param {MongoDBTransaction} [dbTransaction]
   *
   * @returns {Promise<SVDocument[]>}
   * @throws {InvalidQueryError}
   */
  async fetch(query = {}, dbTransaction = null) {
    const result = this.validateQuery(query);

    if (!result.isValid()) {
      throw new InvalidQueryError(result.getErrors());
    }

    let findQuery = {};
    let findOptions = {};

    // Prepare find query
    if (query.where) {
      findQuery = this.convertWhereToMongoDbQuery(query.where);
    }

    findQuery = Object.assign({ isDeleted: false }, findQuery);

    // Prepare find options
    findOptions = Object.assign({}, findOptions, { limit: query.limit || 100 });

    if (query.startAt && query.startAt > 1) {
      findOptions = Object.assign({}, findOptions, { skip: query.startAt - 1 });
    }

    if (query.startAfter) {
      findOptions = Object.assign({}, findOptions, { skip: query.startAfter });
    }

    if (query.orderBy) {
      const sort = query.orderBy.map(([field, direction]) => {
        const mongoDbField = convertFieldName(field);

        return [mongoDbField, direction === 'asc' ? 1 : -1];
      });

      findOptions = Object.assign({}, findOptions, { sort });
    }

    let results;

    if (dbTransaction) {
      const transactionFunction = async (mongoClient, session) => {
        findOptions = Object.assign({}, findOptions, { session });

        return mongoClient
          .db(this.dbName)
          .collection(this.collectionName)
          .find(findQuery, findOptions).toArray();
      };

      results = await dbTransaction.runWithTransaction(transactionFunction);
    } else {
      results = await this.mongoClient.find(findQuery, findOptions).toArray();
    }

    return results.map(document => this.createSVDocument(document));
  }

  /**
   * Store SVDocument entity
   *
   * @param {SVDocument} svDocument
   * @param {MongoDBTransaction} [dbTransaction]
   * @returns {Promise}
   */
  store(svDocument, dbTransaction) {
    const filter = { _id: svDocument.getDocument().getId() };
    const update = { $set: svDocument.toJSON() };
    let updateOptions = { upsert: true };

    if (dbTransaction) {
      const transactionFunction = async (mongoClient, session) => {
        updateOptions = Object.assign({}, updateOptions, { session });

        return mongoClient
          .db(this.dbName)
          .collection(this.collectionName)
          .updateOne(
            filter,
            update,
            updateOptions,
          );
      };

      return dbTransaction.runWithTransaction(transactionFunction);
    }

    return this.mongoClient.updateOne(
      filter,
      update,
      updateOptions,
    );
  }

  /**
   * Delete SVDocument entity
   *
   * @param {SVDocument} svDocument
   * @param {MongoDBTransaction} [dbTransaction]
   * @returns {Promise}
   */
  async delete(svDocument, dbTransaction) {
    const filter = { _id: svDocument.getDocument().getId() };

    if (dbTransaction) {
      const transactionFunction = async (mongoClient, session) => mongoClient
        .db(this.dbName)
        .collection(this.collectionName)
        .deleteOne(filter, { session });

      return dbTransaction.runWithTransaction(transactionFunction);
    }

    return this.mongoClient.deleteOne(filter);
  }

  /**
   * @private
   * @return {SVDocument}
   */
  createSVDocument({
    userId,
    isDeleted,
    data: storedData,
    reference,
    scope,
    scopeId,
    action,
    currentRevision,
    previousRevisions,
  }) {
    const rawDocument = Object.assign({}, storedData);

    rawDocument.$scope = scope;
    rawDocument.$scopeId = scopeId;
    rawDocument.$action = action;
    rawDocument.$rev = currentRevision.revision;
    rawDocument.$type = this.documentType;
    rawDocument.$meta = {
      userId,
      stReference: {
        blockHash: reference.blockHash,
        blockHeight: reference.blockHeight,
        stHeaderHash: reference.stHash,
        stPacketHash: reference.stPacketHash,
      },
    };

    return new SVDocument(
      userId,
      new Document(rawDocument),
      new Reference(reference),
      isDeleted,
      createRevisions(previousRevisions),
    );
  }
}

module.exports = SVDocumentMongoDbRepository;
