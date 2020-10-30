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
      const key = Buffer.from([1, 2, 3]);
      const value = Buffer.from([4, 2]);

      merkDbTransactionWrapper.data.set(key.toString('hex'), value);

      const result = merkDbTransactionWrapper.get(key);

      expect(result).to.deep.equal(value);
    });

    it('should return value from db', () => {
      const key = Buffer.from([1, 2, 3]);
      const value = Buffer.from([4, 2]);

      merkDBMock.getSync.returns(value);

      const result = merkDbTransactionWrapper.get(key);

      expect(result).to.deep.equal(value);
    });

    it('should return null if value was removed in transaction', () => {
      const key = Buffer.from([1, 2, 3]);
      const value = null;

      merkDBMock.getSync.returns(value);

      merkDbTransactionWrapper.deleted.add(key.toString('hex'));

      const result = merkDbTransactionWrapper.get(key);

      expect(result).to.deep.equal(value);
    });
  });

  describe('#put', () => {
    it('should put value into transaction', () => {
      const key = Buffer.from([1, 2, 3]);
      const value = Buffer.from([4, 2]);

      merkDbTransactionWrapper.deleted.add(key.toString('hex'));

      merkDbTransactionWrapper.put(key, value);

      expect(merkDbTransactionWrapper.deleted.has(key.toString('hex'))).to.be.false();
      expect(merkDbTransactionWrapper.data.get(key.toString('hex'))).to.deep.equals(
        value,
      );
    });
  });

  describe('#delete', () => {
    it('should delete key from transaction', () => {
      const key = Buffer.from([1, 2, 3]);
      const value = Buffer.from([4, 2]);

      merkDbTransactionWrapper.data.set(key.toString('hex'), value);

      merkDbTransactionWrapper.delete(key);

      expect(merkDbTransactionWrapper.deleted.has(key.toString('hex'))).to.be.true();
      expect(merkDbTransactionWrapper.data.get(key.toString('hex'))).to.be.undefined();
    });
  });

  describe('#commit', () => {
    it('should commit transaction', () => {

    });
  });

  describe('#rollback', () => {
    it('should rollback transaction', () => {
      const key = Buffer.from([1, 2, 3]);
      const value = Buffer.from([4, 2]);

      merkDbTransactionWrapper.deleted.add(key.toString('hex'));
      merkDbTransactionWrapper.data.set(key.toString('hex'), value);

      merkDbTransactionWrapper.rollback();

      expect(merkDbTransactionWrapper.deleted.size).to.equal(0);
      expect(merkDbTransactionWrapper.data.size).to.equal(0);
    });
  });
});
