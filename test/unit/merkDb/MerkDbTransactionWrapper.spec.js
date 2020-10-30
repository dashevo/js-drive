const MerkDbTransactionWrapper = require('../../../lib/merkDb/MerkDbTransactionWrapper');

describe('MerkDbTransactionWrapper', () => {
  let merkDbTransactionWrapper;
  let merkDBMock;

  beforeEach(function beforeEach() {
    const batchMock = {
      put: this.sinon.stub(),
      delete: this.sinon.stub(),
      commitSync: this.sinon.stub(),
    };

    batchMock.put.returns(batchMock);
    batchMock.delete.returns(batchMock);
    batchMock.commitSync.returns(batchMock);

    merkDBMock = {
      getSync: this.sinon.stub(),
      batch: this.sinon.stub().returns(batchMock),
    };

    merkDbTransactionWrapper = new MerkDbTransactionWrapper(merkDBMock);
  });

  describe('#get', () => {
    it('should return value from transaction', () => {

    });

    it('should return value from db', () => {

    });

    it('should return null if value was removed in transaction', () => {

    });
  });

  describe('#put', () => {
    it('should put value into transaction', () => {

    });
  });

  describe('#delete', () => {
    it('should delete key from transaction', () => {

    });
  });

  describe('#commit', () => {
    it('should commit transaction', () => {

    });
  });

  describe('#rollback', () => {
    it('should rollback transaction', () => {

    });
  });
});
