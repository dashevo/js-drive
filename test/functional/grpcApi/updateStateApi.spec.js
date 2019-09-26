const {
  StartTransactionRequest,
  ApplyStateTransitionRequest,
  CommitTransactionRequest,
  StartTransactionResponse,
  ApplyStateTransitionResponse,
  CommitTransactionResponse,
} = require('@dashevo/drive-grpc');
const {
  mocha: {
    startDrive,
  },
} = require('@dashevo/dp-services-ctl');

const getSTPacketsFixture = require('../../../lib/test/fixtures/getSTPacketsFixture');
const getStateTransitionsFixture = require('../../../lib/test/fixtures/getStateTransitionsFixture');
const InternalGrpcError = require('../../../lib/grpcApi/error/InternalGrpcError');

describe('applyStateTransitionHandlerFactory', () => {
  let grpcClient;
  let driveApiClient;
  let stPacket;
  let stateTransition;
  let startTransactionRequest;
  let applyStateTransitionRequest;
  let commitTransactionRequest;

  const height = 1;
  const hash = 'b4749f017444b051c44dfd2720e88f314ff94f3dd6d56d40ef65854fcd7fff6b';

  startDrive().then((services) => {
    grpcClient = services.driveUpdateStateApi.getClient();
    driveApiClient = services.driveApi.getClient();
  });

  beforeEach(async () => {
    [stPacket] = getSTPacketsFixture();
    [stateTransition] = getStateTransitionsFixture(1);

    startTransactionRequest = new StartTransactionRequest();

    applyStateTransitionRequest = new ApplyStateTransitionRequest();
    applyStateTransitionRequest.setStateTransitionHeader(Buffer.from(stateTransition.serialize(), 'hex'));
    applyStateTransitionRequest.setStateTransitionPacket(stPacket.serialize());
    applyStateTransitionRequest.setBlockHeight(height);
    applyStateTransitionRequest.setBlockHash(hash);

    commitTransactionRequest = new CommitTransactionRequest();
    commitTransactionRequest.setBlockHeight();
  });

  it('should successfully apply state transition and commit data', async () => {
    const startTransactionResponse = await grpcClient.startTransaction(startTransactionRequest);
    const applyStateTransitionResponse = await grpcClient
      .applyStateTransition(applyStateTransitionRequest);
    const commitTransactionResponse = await grpcClient.commitTransaction(commitTransactionRequest);

    expect(startTransactionResponse).to.be.an.instanceOf(StartTransactionResponse);
    expect(applyStateTransitionResponse).to.be.an.instanceOf(ApplyStateTransitionResponse);
    expect(commitTransactionResponse).to.be.an.instanceOf(CommitTransactionResponse);

    // check we have our data in database
    const contract = await driveApiClient.fetchContract(stPacket.getContractId());
    const documents = await Promise.all(
      stPacket.getDocuments().map(
        document => driveApiClient.fetchDocuments(stPacket.getContractId(), document.getType()),
      ),
    );

    expect(contract.toJSON()).to.deep.equal(stPacket.getContract().toJSON());

    const storedDocumentsJson = documents.map(document => document.toJSON());
    const stPacketDocumentsJson = stPacket.getDocuments().map(document => document.toJSON());

    expect(storedDocumentsJson).to.deep.equal(stPacketDocumentsJson);
  });

  it('should thrown an error if startTransaction endpoint was not called', async () => {
    try {
      await grpcClient.applyStateTransition(applyStateTransitionRequest);
      await grpcClient.commitTransaction(commitTransactionRequest);

      expect.fail('should throw an error');
    } catch (error) {
      expect(error).to.be.an.instanceOf(InternalGrpcError);
      expect(error.getMessage()).to.equal('Internal error');
      expect(error.getError().message).to.equal('Transaction is not started');
    }
  });

  it('should check if new data is only visible after transaction was committed', async () => {
    await grpcClient.startTransaction(startTransactionRequest);
    await grpcClient.applyStateTransition(applyStateTransitionRequest);

    // get data from database and check data is empty

    let contract = await driveApiClient.fetchContract(stPacket.getContractId());
    let documents = await Promise.all(
      stPacket.getDocuments().map(
        document => driveApiClient.fetchDocuments(stPacket.getContractId(), document.getType()),
      ),
    );

    expect(documents).to.have.length(0);
    expect(contract).to.be(null);


    await grpcClient.commitTransaction(commitTransactionRequest);

    // get data from db again and check it equals
    contract = await driveApiClient.fetchContract(stPacket.getContractId());
    documents = await Promise.all(
      stPacket.getDocuments().map(
        document => driveApiClient.fetchDocuments(stPacket.getContractId(), document.getType()),
      ),
    );

    expect(contract.toJSON()).to.deep.equal(stPacket.getContract().toJSON());

    const storedDocumentsJson = documents.map(document => document.toJSON());
    const stPacketDocumentsJson = stPacket.getDocuments().map(document => document.toJSON());

    expect(storedDocumentsJson).to.deep.equal(stPacketDocumentsJson);
  });

  it('should throw an error if startTransaction endpoint was called twice', async () => {
    await grpcClient.startTransaction(startTransactionRequest);

    try {
      await grpcClient.startTransaction(startTransactionRequest);

      expect.fail('should throw an error');
    } catch (error) {
      expect(error).to.be.an.instanceOf(InternalGrpcError);
      expect(error.getMessage()).to.equal('Internal error');
      expect(error.getError().message).to.equal('Transaction is already started');
    }
  });
});
