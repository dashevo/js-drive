const CID = require('cids');

const removeSTPacketMethodFactory = require('../../../../lib/api/methods/removeSTPacketMethodFactory');
const InvalidParamsError = require('../../../../lib/api/InvalidParamsError');

describe('removeSTPacketMethod', () => {
  let removeSTPacket;
  let removeSTPacketMethod;
  beforeEach(function beforeEach() {
    removeSTPacket = this.sinon.stub();
    removeSTPacketMethod = removeSTPacketMethodFactory(removeSTPacket);
  });

  it('should throw error if "cid" params is missing', () => {
    expect(removeSTPacketMethod({ })).to.be.rejectedWith(InvalidParamsError);
    expect(removeSTPacket).to.not.be.called();
  });

  it('should throw error if "cid" params is not a valid CID hash', () => {
    expect(removeSTPacketMethod({ cid: 'wrong' })).to.be.rejectedWith(InvalidParamsError);
    expect(removeSTPacket).to.not.be.called();
  });

  it('should delete ST Packet', async () => {
    const cidHash = 'zdrSLCCKBrU4ma3BQA3gcjjXLRbBiYk38cocCGfFbcvRZdsMu';
    const cid = new CID(cidHash);

    await removeSTPacketMethod({ cid: cidHash });

    expect(removeSTPacket).to.be.calledOnce();
    expect(removeSTPacket).to.be.calledWith(cid);
  });
});
