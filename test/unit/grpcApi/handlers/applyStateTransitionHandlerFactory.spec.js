const { ApplyStateTransitionResponse, ApplyStateTransitionRequest } = require('@dashevo/drive-grpc');
const createDPPMock = require('@dashevo/dpp/lib/test/mocks/createDPPMock');
const InvalidSTPacketError = require('@dashevo/dpp/lib/stPacket/errors/InvalidSTPacketError');

const MongoDBTransaction = require('../../../../lib/mongoDb/MongoDBTransaction');
const applyStateTransitionHandlerFactory = require('../../../../lib/grpcApi/handlers/applyStateTransitionHandlerFactory');
const GrpcCallMock = require('../../../../lib/test/mock/GrpcCallMock');
const mongoClientMock = require('../../../../lib/test/mock/getMongoClientMock');
const InvalidArgumentGrpcError = require('../../../../lib/grpcApi/error/InvalidArgumentGrpcError');
const InternalGrpcError = require('../../../../lib/grpcApi/error/InternalGrpcError');
const getSTPacketsFixture = require('../../../../lib/test/fixtures/getSTPacketsFixture');
const getStateTransitionsFixture = require('../../../../lib/test/fixtures/getStateTransitionsFixture');

describe('applyStateTransitionHandlerFactory', () => {
  let applyStateTransitionHandler;
  let call;
  let mongoDBTransaction;
  let request;
  let dppMock;
  let applyStateTransition;

  beforeEach(function beforeEach() {
    mongoDBTransaction = new MongoDBTransaction(mongoClientMock);
    applyStateTransition = this.sinon.stub();
    dppMock = createDPPMock(this.sinon);

    dppMock.packet.createFromSerialized.returns({
      isValid: this.sinon.stub().returns(true),
    });

    dppMock.packet.verify.returns({
      isValid: this.sinon.stub().returns(true),
      getErrors: this.sinon.stub().returns(''),
    });

    applyStateTransitionHandler = applyStateTransitionHandlerFactory(
      mongoDBTransaction,
      dppMock,
      applyStateTransition,
    );

    const [stPacket] = getSTPacketsFixture();
    const [stateTransition] = getStateTransitionsFixture(1);
    const transitionHex = stateTransition.serialize();

    request = new ApplyStateTransitionRequest();
    request.getBlockHeight = this.sinon.stub().returns(1);
    request.getBlockHash = this.sinon.stub().returns('hash');
    request.getStateTransitionPacket = this.sinon.stub().returns(stPacket.serialize());
    request.getStateTransitionHeader = this.sinon.stub().returns(Buffer.from(transitionHex, 'hex'));

    call = new GrpcCallMock(this.sinon, request);
  });

  describe('throw InvalidArgumentGrpcError error', () => {
    it('should fail with missed stateTransitionPacket param', async () => {
      request.getStateTransitionPacket.returns(null);

      try {
        await applyStateTransitionHandler(call);
        expect.fail('should throw an InvalidArgumentGrpcError error');
      } catch (error) {
        expect(error).to.be.an.instanceOf(InvalidArgumentGrpcError);
        expect(error.message).to.be.equal('Invalid argument: stateTransitionPacket is not specified');
      }
    });

    it('should fail with missed stateTransitionHeader param', async () => {
      request.getStateTransitionHeader.returns(null);

      try {
        await applyStateTransitionHandler(call);
        expect.fail('should throw an InvalidArgumentGrpcError error');
      } catch (error) {
        expect(error).to.be.an.instanceOf(InvalidArgumentGrpcError);
        expect(error.message).to.be.equal('Invalid argument: stateTransitionHeader is not specified');
      }
    });

    it('should fail with missed blockHeight param', async () => {
      request.getBlockHeight.returns(null);

      try {
        await applyStateTransitionHandler(call);
        expect.fail('should throw an InvalidArgumentGrpcError error');
      } catch (error) {
        expect(error).to.be.an.instanceOf(InvalidArgumentGrpcError);
        expect(error.message).to.be.equal('Invalid argument: blockHeight is not specified');
      }
    });

    it('should fail with missed blockHash param', async () => {
      request.getBlockHash.returns(null);

      try {
        await applyStateTransitionHandler(call);
        expect.fail('should throw an InvalidArgumentGrpcError error');
      } catch (error) {
        expect(error).to.be.an.instanceOf(InvalidArgumentGrpcError);
        expect(error.message).to.be.equal('Invalid argument: blockHash is not specified');
      }
    });

    it('should fail with invalid stateTransitionPacket param', async () => {
      dppMock.packet.createFromSerialized.throws(new InvalidSTPacketError());

      try {
        await applyStateTransitionHandler(call);
        expect.fail('should throw an InvalidArgumentGrpcError error');
      } catch (error) {
        expect(error).to.be.an.instanceOf(InvalidArgumentGrpcError);
        expect(error.message).to.be.equal('Invalid argument: Invalid ST Packet');
      }
    });

    it('should fail with invalid stateTransitionHeader param', async () => {
      request.getStateTransitionHeader.returns(Buffer.from('b8ae412cdeeb4bb39ec496dec34495ecccaf74f9fa9eaa712c77a0', 'hex'));

      try {
        await applyStateTransitionHandler(call);
        expect.fail('should throw an InvalidArgumentGrpcError error');
      } catch (error) {
        expect(error).to.be.an.instanceOf(InvalidArgumentGrpcError);
        expect(error.message).to.equal('Invalid argument: Invalid "stateTransitionHeader" param: The value of "offset" is out of range. It must be >= 0 and <= 23. Received 37');
      }
    });

    it('should fail with invalid stPacket and stateTransition params', async () => {
      dppMock.packet.verify().isValid.returns(false);

      try {
        await applyStateTransitionHandler(call);
        expect.fail('should throw an InvalidArgumentGrpcError error');
      } catch (error) {
        expect(error).to.be.an.instanceOf(InvalidArgumentGrpcError);
        expect(error.message).to.be.equal('Invalid argument: Invalid "stPacket" and "stateTransition" params: ');
      }
    });
  });

  describe('throw InternalGrpcError error', () => {
    it('should fail with "Transaction is not started" error', async () => {
      applyStateTransition.throws(new Error('Transaction is not started'));

      try {
        await applyStateTransitionHandler(call);
        expect.fail('should throw an InvalidArgumentGrpcError error');
      } catch (error) {
        expect(error).to.be.an.instanceOf(InternalGrpcError);
        expect(error.getMessage()).to.equal('Internal error');
        expect(error.getError().message).to.equal('Transaction is not started');
      }
    });
  });

  describe('valid result', () => {
    it('should return valid result', async () => {
      const response = await applyStateTransitionHandler(call);

      expect(response).to.be.an.instanceOf(ApplyStateTransitionResponse);
    });
  });
});
