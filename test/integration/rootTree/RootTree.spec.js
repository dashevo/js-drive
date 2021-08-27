const RootTree = require('../../../lib/rootTree/RootTree');

const { init: initHashFunction, hashFunction } = require('../../../lib/rootTree/hashFunction');

const InvalidLeafIndexError = require('../../../lib/rootTree/errors/InvalidLeafIndexError');
const parseProof = require('../../../lib/test/util/parseProof');

describe('RootTree', () => {
  let leafMocks;
  let leafOneMock;
  let leafTwoMock;
  let leafHashes;
  let rootTree;
  let rootHash;

  before(async () => {
    await initHashFunction();
  });

  beforeEach(() => {
    leafMocks = [];
    leafHashes = [];
    for (let i = 0; i < 6; i++) {
      const leafHash = Buffer.alloc(32, i);
      leafHashes.push(leafHash);
      leafMocks.push({
        getIndex() {
          return i;
        },
        getHash() {
          return hashFunction(leafHash);
        },
        getProof() {
          return Buffer.from('03046b657931060076616c75653103046b657932060076616c75653210', 'hex');
        },
      });
    }

    rootHash = Buffer.from('abef5054482ca01a1c7a1fb405038eac03d6d1e287798770639fec85830be4eb', 'hex');

    [leafOneMock, leafTwoMock] = leafMocks;

    rootTree = new RootTree(leafMocks);
  });

  describe('#constructor', () => {
    it('should throw an error if a leaf index in not corresponding to leaves param order', () => {
      expect(() => {
        // eslint-disable-next-line no-new
        new RootTree([leafTwoMock, leafOneMock]);
      }).to.throw(InvalidLeafIndexError);
    });
  });

  describe('#getRootHash', () => {
    it('should return merkle root calculated with specified leaves', () => {
      const actualRootHash = rootTree.getRootHash();

      expect(actualRootHash).to.deep.equal(rootHash);
    });

    it('should return empty buffer if leafHashes consist of empty buffers', () => {
      leafOneMock.getHash = () => Buffer.alloc(20);
      leafTwoMock.getHash = () => Buffer.alloc(20);

      rootTree = new RootTree([leafOneMock, leafTwoMock]);

      const actualRootHash = rootTree.getRootHash();

      expect(actualRootHash).to.deep.equal(Buffer.alloc(0));
    });
  });

  describe('#getProof', () => {
    it('should return a proof for the first leaf', () => {
      const proof = rootTree.getProof([leafOneMock]);

      expect(proof).to.deep.equal(
        Buffer.from('02ec85b4eec3cbbcb470d9435bc2ea6926aa8674d02155fb4c21948cbf484e513c78c5be627ff557725397092e314dfeb88d535d9b9d5d0f42df9df3079b5d8eac', 'hex'),
      );
    });

    it('should return a proof for the second leaf', () => {
      const proof = rootTree.getProof([leafTwoMock]);

      expect(proof).to.deep.equal(
        Buffer.from('02032a842dcdaafd970f434e36e97ac2caf8a3cd0bc0df77568b7f8e44ef8a4e6578c5be627ff557725397092e314dfeb88d535d9b9d5d0f42df9df3079b5d8eac', 'hex'),
      );
    });
  });

  describe('#getFullProof', () => {
    it('should return a full proof', () => {
      const leafKeys = [
        Buffer.from([1]),
      ];

      const fullProof = rootTree.getFullProof(leafOneMock, leafKeys);

      expect(fullProof).to.be.deep.equal({
        rootTreeProof: Buffer.from('02ec85b4eec3cbbcb470d9435bc2ea6926aa8674d02155fb4c21948cbf484e513c78c5be627ff557725397092e314dfeb88d535d9b9d5d0f42df9df3079b5d8eac', 'hex'),
        storeTreeProof: Buffer.from('03046b657931060076616c75653103046b657932060076616c75653210', 'hex'),
      });
    });
  });

  describe('#rebuild', () => {
    it('should rebuild root tree with updated leaf hashes', () => {
      leafOneMock.getHash = () => Buffer.alloc(32).fill(3);

      let actualRootHash = rootTree.getRootHash();

      expect(actualRootHash).to.deep.equal(rootHash);

      rootTree.rebuild();

      actualRootHash = rootTree.getRootHash();

      expect(actualRootHash).to.not.deep.equal(rootHash);
    });
  });

  describe('#verification', () => {
    it('should verify proof', () => {
      const proofBuffer = rootTree.getProof([leafMocks[4], leafMocks[5]]);

      const proof = parseProof(proofBuffer);


      const result = rootTree.tree.verifyMultiProof(
        rootTree.tree.getRoot(),
        [
          leafMocks[4].getIndex(),
          leafMocks[5].getIndex(),
        ],
        [
          leafMocks[4].getHash(),
          leafMocks[5].getHash(),
        ],
        3,
        proof,
      );

      expect(result).to.be.true();
    });
  });
});
