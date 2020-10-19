const {
  abci: {
    ResponseQuery,
  },
} = require('abci/types');

const cbor = require('cbor');

const InvalidQueryError = require('../../../document/errors/InvalidQueryError');
const InvalidArgumentAbciError = require('../../errors/InvalidArgumentAbciError');

/**
 *
 * @param {fetchDocuments} fetchDocuments
 * @return {documentQueryHandler}
 */
function documentQueryHandlerFactory(fetchDocuments) {
  /**
   * @typedef documentQueryHandler
   * @param {Object} params
   * @param {Object} options
   * @param {Buffer} options.contractId
   * @param {string} options.type
   * @return {Promise<ResponseQuery>}
   */
  async function documentQueryHandler(params, options) {
    let documents;
    const { contractId, type } = options;

    try {
      documents = await fetchDocuments(contractId, type, {
        where: options.where,
        orderBy: options.orderBy,
        limit: options.limit,
        startAfter: options.startAfter,
        startAt: options.startAt,
      });
    } catch (e) {
      if (e instanceof InvalidQueryError) {
        throw new InvalidArgumentAbciError(
          `Invalid query: ${e.getErrors()[0].message}`,
          { errors: e.getErrors() },
        );
      }

      throw e;
    }

    return new ResponseQuery({
      value: await cbor.encodeAsync(
        documents.map((d) => d.toBuffer()),
      ),
    });
  }

  return documentQueryHandler;
}

module.exports = documentQueryHandlerFactory;
