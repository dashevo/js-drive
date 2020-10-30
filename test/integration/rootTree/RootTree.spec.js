const RootTree = require('../../../lib/rootTree/RootTree');

const hashFunction = require('../../../lib/rootTree/hashFunction');

const InvalidLeafIndexError = require('../../../lib/rootTree/errors/InvalidLeafIndexError');

describe('RootTree', () => {
  let leafOneMock;
  let leafTwoMock;
  let rootTree;
  let rootHash;

  beforeEach(() => {
    const leafOneRootHash = Buffer.alloc(32).fill(1);
    const leafTwoRootHash = Buffer.alloc(32).fill(2);
    rootHash = Buffer.from('b41f077ca124f5ef535370daf41c74a2bc48ba7eb868e7337cc1f7f4abff1cae', 'hex');

    leafOneMock = {
      getIndex() {
        return 0;
      },
      getHash() {
        return hashFunction(leafOneRootHash);
      },
    };

    leafTwoMock = {
      getIndex() {
        return 1;
      },
      getHash() {
        return hashFunction(leafTwoRootHash);
      },
    };

    rootTree = new RootTree([leafOneMock, leafTwoMock]);
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
  });

  describe('#getProof', () => {
    it('should return a proof for the first leaf', () => {
      const proof = rootTree.getProof(leafOneMock);

      expect(proof).to.deep.equal([
        {
          position: 'right',
          data: Buffer.from('d9818087de7244abc1b5fcf28e55e42c7ff9c678c0605181f37ac5d7414a7b95', 'hex'),
        },
      ]);
    });

    it('should return a proof for the second leaf', () => {
      const proof = rootTree.getProof(leafTwoMock);

      expect(proof).to.deep.equal([
        {
          position: 'left',
          data: Buffer.from('f40ceaf86e5776923332b8d8fd3bef849cadb19c6996bc272af1f648d9566a4c', 'hex'),
        },
      ]);
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
});
