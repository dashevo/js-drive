const {
  abci: {
    ResponseQuery,
  },
} = require('abci/types');

const cbor = require('cbor');

const documentQueryHandlerFactory = require('../../../../../lib/abci/handlers/query/documentQueryHandlerFactory');
const InvalidQueryError = require('../../../../../lib/document/errors/InvalidQueryError');
const ValidationError = require('../../../../../lib/document/query/errors/ValidationError');
const InvalidArgumentAbciError = require('../../../../../lib/abci/errors/InvalidArgumentAbciError');
const AbciError = require('../../../../../lib/abci/errors/AbciError');

describe('documentQueryHandlerFactory', () => {
  let documentQueryHandler;
  let fetchDocumentsMock;
  let documentsMock;
  let data;

  beforeEach(function beforeEach() {
    data = 'data';

    documentsMock = [{
      serialize: this.sinon.stub().returns(data),
    }];

    fetchDocumentsMock = this.sinon.stub();

    documentQueryHandler = documentQueryHandlerFactory(
      fetchDocumentsMock,
    );
  });

  it('should return serialized documents', async () => {
    const contractId = 'contractId';
    const type = 1;
    const options = {};

    fetchDocumentsMock.resolves(documentsMock);

    const result = await documentQueryHandler({ contractId, type }, options);

    expect(fetchDocumentsMock).to.be.calledOnceWith(contractId, type, options);
    expect(result).to.be.an.instanceof(ResponseQuery);
    expect(result.value).to.deep.equal(cbor.encode([data]));
  });

  it('should throw InvalidArgumentAbciError on invalid query', async () => {
    const contractId = 'contractId';
    const type = 1;
    const options = {};
    const error = new ValidationError('Some error');
    const queryError = new InvalidQueryError([error]);
    fetchDocumentsMock.throws(queryError);

    try {
      await documentQueryHandler({ contractId, type }, options);

      expect.fail('should throw ');
    } catch (e) {
      expect(e).to.be.an.instanceof(InvalidArgumentAbciError);
      expect(e.getCode()).to.equal(AbciError.CODES.INVALID_ARGUMENT);
      expect(e.getData()).to.deep.equal({ errors: [error] });
      expect(fetchDocumentsMock).to.be.calledOnceWith(contractId, type, options);
    }
  });

  it('should throw error if fetchDocuments throws unknown error', async () => {
    const error = new Error('Some error');
    const contractId = 'contractId';
    const type = 1;
    const options = {};
    fetchDocumentsMock.throws(error);

    try {
      await documentQueryHandler({ contractId, type }, options);

      expect.fail('should throw ');
    } catch (e) {
      expect(e).to.deep.equal(error);
      expect(fetchDocumentsMock).to.be.calledOnceWith(contractId, type, options);
    }
  });
});
