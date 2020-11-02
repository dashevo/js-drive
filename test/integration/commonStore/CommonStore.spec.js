const merk = require('merk');

const Long = require('long');

const CommonStore = require('../../../lib/commonStore/CommonStore');

describe('ChainInfoCommonStoreRepository', () => {
  let db;
  let commonStore;
  let chainInfo;
  let lastBlockHeight;
  let lastBlockAppHash;

  beforeEach(() => {
    db = merk('./db/common-store-merkdb-test');

    commonStore = new CommonStore(db);

    lastBlockHeight = Long.fromInt(42);
    lastBlockAppHash = Buffer.from('something');

    chainInfo = new ChainInfo(lastBlockHeight, lastBlockAppHash);
  });

  afterEach(async () => {
    await db.clear();
    await db.close();
  });

  describe('#store', () => {
    it('should store chain info', async () => {
      const repositoryInstance = await commonStore.store(chainInfo);
      expect(repositoryInstance).to.equal(commonStore);

      const storedStateBuffer = await db.get(ChainInfoCommonStoreRepository.COMMON_STORE_KEY_NAME);

      expect(storedStateBuffer).to.be.instanceOf(Buffer);

      const storedState = cbor.decode(storedStateBuffer);

      expect(storedState).to.have.property('lastBlockHeight', lastBlockHeight.toString());

      expect(storedState).to.have.property('lastBlockAppHash');
      expect(storedState.lastBlockAppHash).to.deep.equal(lastBlockAppHash);
    });
  });

  describe('#getRootHash', () => {
    it('should return root hash of empty info', async () => {
      const hashOfNil = Buffer.from(
        blake2b(32).update(Buffer.alloc(0)).digest(),
      );

      const result = await commonStore.getRootHash();

      expect(result).to.deep.equal(hashOfNil);
    });

    it('should return hash of chain info', async () => {
      const chainInfoBuffer = cbor.encodeCanonical(chainInfo.toJSON());

      const rootHash = Buffer.from(
        blake2b(32).update(chainInfoBuffer).digest(),
      );

      await db.put(ChainInfoCommonStoreRepository.COMMON_STORE_KEY_NAME, chainInfoBuffer);

      const result = await commonStore.getRootHash();

      expect(result).to.deep.equal(rootHash);
    });
  });

  describe('#fetch', () => {
    it('should return empty chain info if it is not stored', async () => {
      const result = await commonStore.fetch();

      expect(result).to.be.instanceOf(ChainInfo);
      expect(result.getLastBlockHeight()).to.be.instanceOf(Long);
      expect(result.getLastBlockHeight().toInt()).to.equal(0);
      expect(result.getLastBlockAppHash()).to.deep.equal(Buffer.alloc(0));
    });

    it('should return stored chain info', async () => {
      const storedStateBuffer = cbor.encode(chainInfo.toJSON());

      await db.put(ChainInfoCommonStoreRepository.COMMON_STORE_KEY_NAME, storedStateBuffer);

      const result = await commonStore.fetch();

      expect(result).to.be.instanceOf(ChainInfo);
      expect(result.getLastBlockHeight()).to.be.instanceOf(Long);
      expect(result.getLastBlockHeight()).to.deep.equal(lastBlockHeight);
      expect(result.getLastBlockAppHash()).to.deep.equal(lastBlockAppHash);
    });
  });
});
