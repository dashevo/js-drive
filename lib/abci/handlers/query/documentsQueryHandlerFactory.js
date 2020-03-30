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
 * @return {documentsQueryHandler}
 */
function documentsQueryHandlerFactory(fetchDocuments) {
  /**
   * @typedef documentsQueryHandler
   * @param {Object} params
   * @param {string} params.contractId
   * @param {string} params.type
   * @param {Object} options
   * @return {Promise<ResponseQuery>}
   */
  async function documentsQueryHandler({ contractId, type }, options) {
    let documents;

    try {
      documents = await fetchDocuments(contractId, type, options);
    } catch (e) {
      if (e instanceof InvalidQueryError) {
        throw new InvalidArgumentAbciError(
          `Invalid query: ${e.getErrors()[0].message}`,
          { errors: e.getErrors() },
        );
      }

      throw e;
    }

    return ResponseQuery({
      value: await cbor.encodeAsync(
        documents.map(d => d.serialize()),
      ),
    });
  }

  return documentsQueryHandler;
}

module.exports = documentsQueryHandlerFactory;
