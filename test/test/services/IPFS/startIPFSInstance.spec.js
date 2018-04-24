const startIPFSInstance = require('../../../../lib/test/services/IPFS/startIPFSInstance');

describe('Test', function main() {
  this.timeout(20000);

  describe('startIPFSInstance', () => {
    describe('One instance', () => {
      let ipfsAPI;

      before(async () => {
        ipfsAPI = await startIPFSInstance();
      });

      it('should start one instance', async () => {
        const actualTrueObject = await ipfsAPI.block.put(Buffer.from('{"true": true}'));
        const expectedTrueObject = await ipfsAPI.block.get(actualTrueObject.cid);
        expect(expectedTrueObject.data).to.be.deep.equal(actualTrueObject.data);
      });
    });

    describe('Three instances', () => {
      let ipfsAPIs;

      before(async () => {
        ipfsAPIs = await startIPFSInstance.many(3);
      });

      it('should start many instances', async () => {
        const actualTrueObject = await ipfsAPIs[0].block.put(Buffer.from('{"true": true}'));

        for (let i = 1; i < 3; i++) {
          const expectedTrueObject = await ipfsAPIs[i].block.get(actualTrueObject.cid);
          expect(expectedTrueObject.data).to.be.deep.equal(actualTrueObject.data);
        }
      });
    });
  });
});
