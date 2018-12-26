const proxyquire = require('proxyquire');

const InvalidParamsError = require('../../../../lib/api/InvalidParamsError');

describe('removeSTPacketMethod', () => {
  let removeSTPacket;
  let removeSTPacketMethod;
  let stateTransitonPacketMock;
  beforeEach(function beforeEach() {
    stateTransitonPacketMock = {
      createCIDFromHash: this.sinon.stub(),
    };

    const removeSTPacketMethodFactory = proxyquire(
      '../../../../lib/api/methods/removeSTPacketMethodFactory',
      {
        '../../storage/stPacket/StateTransitionPacket': stateTransitonPacketMock,
      },
    );

    removeSTPacket = this.sinon.stub();
    removeSTPacketMethod = removeSTPacketMethodFactory(removeSTPacket);
  });

  it('should throw error if "packetHash" params is missing', () => {
    expect(removeSTPacketMethod({ })).to.be.rejectedWith(InvalidParamsError);
    expect(removeSTPacket).to.not.be.called();
  });

  it('should throw error if "packetHash" params is not a valid CID hash', () => {
    stateTransitonPacketMock.createCIDFromHash.throws(new InvalidParamsError());
    expect(removeSTPacketMethod({ packetHash: 'wrong' })).to.be.rejectedWith(InvalidParamsError);
    expect(removeSTPacket).to.not.be.called();
  });

  it('should delete ST Packet', async () => {
    const cid = {
      value: 'some_potential_cid',
    };
    stateTransitonPacketMock.createCIDFromHash.returns(cid);

    await removeSTPacketMethod({ packetHash: 'some_packet_hash' });

    expect(removeSTPacket).to.be.calledOnce();
    expect(removeSTPacket).to.be.calledWith(cid);
  });
});
