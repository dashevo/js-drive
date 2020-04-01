const {
  abci: {
    ResponseQuery,
  },
} = require('abci/types');

const getDataContractFixture = require('@dashevo/dpp/lib/test/fixtures/getDataContractFixture');

const dataContractQueryHandlerFactory = require('../../../../../lib/abci/handlers/query/dataContractQueryHandlerFactory');

const InvalidArgumentAbciError = require('../../../../../lib/abci/errors/InvalidArgumentAbciError');
const AbciError = require('../../../../../lib/abci/errors/AbciError');

describe('dataContractQueryHandlerFactory', () => {
  let dataContractQueryHandler;
  let dataContractRepositoryMock;
  let dataContract;

  beforeEach(function beforeEach() {
    dataContract = getDataContractFixture();

    dataContractRepositoryMock = {
      fetch: this.sinon.stub(),
    };

    dataContractQueryHandler = dataContractQueryHandlerFactory(
      dataContractRepositoryMock,
    );
  });

  it('should return serialized data contract', async () => {
    const id = 'id';

    dataContractRepositoryMock.fetch.resolves(dataContract);

    const result = await dataContractQueryHandler({ id });

    expect(dataContractRepositoryMock.fetch).to.be.calledOnceWith(id);
    expect(result).to.be.an.instanceof(ResponseQuery);
    expect(result.code).to.equal(0);
    expect(result.value).to.deep.equal(dataContract.serialize());
  });

  it('should throw InvalidArgumentAbciError if data contract not found', async () => {
    const id = 'id';

    try {
      await dataContractQueryHandler({ id });

      expect.fail('should throw InvalidArgumentAbciError');
    } catch (e) {
      expect(e).to.be.an.instanceof(InvalidArgumentAbciError);
      expect(e.getCode()).to.equal(AbciError.CODES.INVALID_ARGUMENT);
      expect(e.message).to.equal('Data Contract with specified ID is not found');
      expect(dataContractRepositoryMock.fetch).to.be.calledOnceWith(id);
    }
  });
});
