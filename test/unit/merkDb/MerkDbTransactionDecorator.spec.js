const MerkDbTransactionWrapper = require('../../../lib/merkDb/MerkDbTransactionDecorator');

describe('MerkDbTransactionWrapper', () => {
  let merkDbTransactionDecorator;
  let merkDBMock;
  let batchMock;

  beforeEach(function beforeEach() {
    batchMock = {
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

    merkDbTransactionDecorator = new MerkDbTransactionWrapper(merkDBMock);
  });

  describe('#get', () => {
    it('should return value from transaction', () => {
      const key = Buffer.from([1, 2, 3]);
      const value = Buffer.from([4, 2]);

      merkDbTransactionDecorator.data.set(key.toString('hex'), value);

      const result = merkDbTransactionDecorator.get(key);

      expect(result).to.deep.equal(value);
    });

    it('should return value from db', () => {
      const key = Buffer.from([1, 2, 3]);
      const value = Buffer.from([4, 2]);

      merkDBMock.getSync.returns(value);

      const result = merkDbTransactionDecorator.get(key);

      expect(result).to.deep.equal(value);
    });

    it('should return null if value was removed in transaction', () => {
      const key = Buffer.from([1, 2, 3]);
      const value = null;

      merkDBMock.getSync.returns(value);

      merkDbTransactionDecorator.deleted.add(key.toString('hex'));

      const result = merkDbTransactionDecorator.get(key);

      expect(result).to.deep.equal(value);
    });
  });

  describe('#put', () => {
    it('should put value into transaction', () => {
      const key = Buffer.from([1, 2, 3]);
      const value = Buffer.from([4, 2]);

      merkDbTransactionDecorator.deleted.add(key.toString('hex'));

      merkDbTransactionDecorator.put(key, value);

      expect(merkDbTransactionDecorator.deleted.has(key.toString('hex'))).to.be.false();
      expect(merkDbTransactionDecorator.data.get(key.toString('hex'))).to.deep.equals(
        value,
      );
    });
  });

  describe('#delete', () => {
    it('should delete key from transaction', () => {
      const key = Buffer.from([1, 2, 3]);
      const value = Buffer.from([4, 2]);

      merkDbTransactionDecorator.data.set(key.toString('hex'), value);

      merkDbTransactionDecorator.delete(key);

      expect(merkDbTransactionDecorator.deleted.has(key.toString('hex'))).to.be.true();
      expect(merkDbTransactionDecorator.data.get(key.toString('hex'))).to.be.undefined();
      expect(merkDBMock.getSync).to.be.calledOnce();
    });

    it('should not add removing key to transaction if key not exists in merkDB', async () => {
      const error = new Error('key not found');

      const key = Buffer.from([1, 2, 3]);

      merkDBMock.getSync.throws(error);

      merkDbTransactionDecorator.delete(key);

      expect(merkDbTransactionDecorator.deleted.has(key.toString('hex'))).to.be.false();
      expect(merkDbTransactionDecorator.data.get(key.toString('hex'))).to.be.undefined();
      expect(merkDBMock.getSync).to.be.calledOnce();
    });

    it('should throw an error', async () => {
      const error = new Error('unknown error');

      const key = Buffer.from([1, 2, 3]);

      merkDBMock.getSync.throws(error);

      try {
        merkDbTransactionDecorator.delete(key);

        expect.fail('should throw unknown error');
      } catch (e) {
        expect(e).to.equal(error);
      }
    });
  });

  describe('#commit', () => {
    it('should commit transaction', () => {
      const keyToAdd = Buffer.from([1, 2, 3]);
      const keyToRemove = Buffer.from([1, 2, 3]);
      const valueToAdd = Buffer.from([4, 2]);

      merkDbTransactionDecorator.data.set(keyToAdd.toString('hex'), valueToAdd);
      merkDbTransactionDecorator.deleted.add(keyToRemove.toString('hex'));

      merkDbTransactionDecorator.commit();

      expect(merkDbTransactionDecorator.data.size).to.be.equal(0);
      expect(merkDbTransactionDecorator.deleted.size).to.be.equal(0);

      expect(merkDBMock.batch).to.be.calledOnce();
      expect(batchMock.put).to.be.calledOnce();
      expect(batchMock.delete).to.be.calledOnce();
      expect(batchMock.commitSync).to.be.calledOnce();
    });

    it('should skip commit if nothing to commit', async () => {
      expect(merkDbTransactionDecorator.data.size).to.be.equal(0);
      expect(merkDbTransactionDecorator.deleted.size).to.be.equal(0);

      merkDbTransactionDecorator.commit();

      expect(merkDbTransactionDecorator.data.size).to.be.equal(0);
      expect(merkDbTransactionDecorator.deleted.size).to.be.equal(0);

      expect(merkDBMock.batch).to.be.not.called();
      expect(batchMock.put).to.be.not.called();
      expect(batchMock.delete).to.be.not.called();
      expect(batchMock.commitSync).to.be.not.called();
    });
  });

  describe('#rollback', () => {
    it('should rollback transaction', () => {
      const key = Buffer.from([1, 2, 3]);
      const value = Buffer.from([4, 2]);

      merkDbTransactionDecorator.deleted.add(key.toString('hex'));
      merkDbTransactionDecorator.data.set(key.toString('hex'), value);

      merkDbTransactionDecorator.rollback();

      expect(merkDbTransactionDecorator.deleted.size).to.equal(0);
      expect(merkDbTransactionDecorator.data.size).to.equal(0);
    });
  });
});
