const {
  mocha: {
    startMongoDb,
    startIPFS,
  },
} = require('@dashevo/dp-services-ctl');

const DashPlatformProtocol = require('@dashevo/dpp');
const Document = require('@dashevo/dpp/lib/document/Document');

const sanitizer = require('../../../../lib/mongoDb/sanitizer');

const ReaderMediator = require('../../../../lib/blockchain/reader/BlockchainReaderMediator');

const Revision = require('../../../../lib/stateView/revisions/Revision');
const Reference = require('../../../../lib/stateView/revisions/Reference');
const SVDocumentMongoDbRepository = require('../../../../lib/stateView/document/SVDocumentMongoDbRepository');
const SVDocument = require('../../../../lib/stateView/document/SVDocument');

const revertSVDocumentsForStateTransitionFactory = require('../../../../lib/stateView/document/revertSVDocumentsForStateTransitionFactory');
const createSVDocumentMongoDbRepositoryFactory = require('../../../../lib/stateView/document/createSVDocumentMongoDbRepositoryFactory');
const updateSVDocumentFactory = require('../../../../lib/stateView/document/updateSVDocumentFactory');
const applyStateTransitionFactory = require('../../../../lib/stateView/applyStateTransitionFactory');
const applyStateTransitionFromReferenceFactory = require('../../../../lib/stateView/applyStateTransitionFromReferenceFactory');

const STPacketIpfsRepository = require('../../../../lib/storage/stPacket/STPacketIpfsRepository');

const RpcClientMock = require('../../../../lib/test/mock/RpcClientMock');
const ReaderMediatorMock = require('../../../../lib/test/mock/BlockchainReaderMediatorMock');

const getBlocksFixture = require('../../../../lib/test/fixtures/getBlocksFixture');
const getStateTransitionsFixture = require('../../../../lib/test/fixtures/getStateTransitionsFixture');
const getSTPacketsFixture = require('../../../../lib/test/fixtures/getSTPacketsFixture');
const getContractFixture = require('../../../../lib/test/fixtures/getContractFixture');

describe('revertSVDocumentsForStateTransitionFactory', () => {
  let userId;
  let stPacketRepository;
  let createSVDocumentMongoDbRepository;
  let updateSVDocument;
  let applyStateTransition;
  let rpcClientMock;
  let readerMediatorMock;
  let revertSVDocumentsForStateTransition;
  let mongoClient;
  let ipfsAPI;
  let stPacket;

  startMongoDb().then((mongoDb) => {
    mongoClient = mongoDb.getClient();
  });

  startIPFS().then((ipfs) => {
    ipfsAPI = ipfs.getApi();
  });

  beforeEach(function beforeEach() {
    userId = '3557b9a8dfcc1ef9674b50d8d232e0e3e9020f49fa44f89cace622a01f43d03e';

    [, stPacket] = getSTPacketsFixture();

    const contract = getContractFixture();

    const dataProviderMock = {
      fetchContract: this.sinon.stub().returns(contract),
    };

    const dpp = new DashPlatformProtocol({
      dataProvider: dataProviderMock,
    });

    stPacketRepository = new STPacketIpfsRepository(
      ipfsAPI,
      dpp,
      1000,
    );

    createSVDocumentMongoDbRepository = createSVDocumentMongoDbRepositoryFactory(
      mongoClient,
      SVDocumentMongoDbRepository,
      sanitizer,
    );

    updateSVDocument = updateSVDocumentFactory(createSVDocumentMongoDbRepository);

    readerMediatorMock = new ReaderMediatorMock(this.sinon);

    applyStateTransition = applyStateTransitionFactory(
      stPacketRepository,
      null,
      updateSVDocument,
      readerMediatorMock,
    );

    rpcClientMock = new RpcClientMock(this.sinon);

    const applyStateTransitionFromReference = applyStateTransitionFromReferenceFactory(
      applyStateTransition,
      rpcClientMock,
    );

    revertSVDocumentsForStateTransition = revertSVDocumentsForStateTransitionFactory(
      stPacketRepository,
      rpcClientMock,
      createSVDocumentMongoDbRepository,
      applyStateTransition,
      applyStateTransitionFromReference,
      readerMediatorMock,
    );
  });

  it('should mark SV Objects as deleted if there is no previous version', async () => {
    const [block] = getBlocksFixture();
    const [stateTransition] = getStateTransitionsFixture();
    const [document] = stPacket.getDocuments();

    stateTransition.extraPayload.regTxId = userId;
    stateTransition.extraPayload.hashSTPacket = stPacket.hash();

    await stPacketRepository.store(stPacket);

    const svObjectRepository = createSVDocumentMongoDbRepository(
      stPacket.getContractId(),
      document.getType(),
    );

    const reference = new Reference({
      blockHash: block.hash,
      blockHeight: block.height,
      stHash: stateTransition.hash,
      stPacketHash: stPacket.hash(),
      hash: document.hash(),
    });

    await updateSVDocument(
      stPacket.getContractId(),
      userId,
      reference,
      document,
    );

    const svObjects = await svObjectRepository.fetch();

    expect(svObjects).to.be.not.empty();

    await revertSVDocumentsForStateTransition({
      stateTransition,
    });

    const svObjectsAfterReverting = await svObjectRepository.fetch();

    expect(svObjectsAfterReverting).to.be.empty();

    expect(readerMediatorMock.emitSerial).to.have.been.calledWith(
      ReaderMediator.EVENTS.DOCUMENT_MARKED_DELETED,
      {
        userId,
        objectId: document.getId(),
        reference,
        object: document.toJSON(),
      },
    );
  });

  it('should revert SV Object to its previous revision if any', async () => {
    // TODO Revert several objects

    // 1. Store 3 revisions of Document in IPFS
    const documentRevisions = [];

    const blocks = getBlocksFixture();
    const stateTransitions = getStateTransitionsFixture();

    const [document] = stPacket.getDocuments();

    for (let i = 0; i < 3; i++) {
      const block = blocks[i];
      const stateTransition = stateTransitions[i];

      const updatedDocument = new Document(document.toJSON());

      if (i > 0) {
        updatedDocument.setAction(Document.ACTIONS.UPDATE);
      }

      updatedDocument.setRevision(i);

      stPacket.setDocuments([updatedDocument]);

      await stPacketRepository.store(stPacket);

      stateTransition.extraPayload.regTxId = userId;
      stateTransition.extraPayload.hashSTPacket = stPacket.hash();

      const reference = new Reference({
        blockHash: block.hash,
        blockHeight: block.height,
        stHash: stateTransition.hash,
        stPacketHash: stPacket.hash(),
        hash: updatedDocument.hash(),
      });

      documentRevisions.push({
        revision: i,
        document: updatedDocument,
        block,
        stateTransition,
        stPacket,
        reference,
      });

      rpcClientMock.getRawTransaction
        .withArgs(stateTransition.hash)
        .resolves({
          result: stateTransition,
        });
    }

    // 2. Create ans store SV Object
    const previousRevisions = documentRevisions.slice(0, 2)
      .map(({ revision, reference }) => (
        new Revision(revision, reference)
      ));

    const thirdDocumentRevision = documentRevisions[documentRevisions.length - 1];

    const svObject = new SVDocument(
      userId,
      thirdDocumentRevision.document,
      thirdDocumentRevision.reference,
      false,
      previousRevisions,
    );

    const svObjectRepository = createSVDocumentMongoDbRepository(
      stPacket.getContractId(),
      document.getType(),
    );

    await svObjectRepository.store(svObject);

    // 3. Revert 3rd version of contract to 2nd
    await revertSVDocumentsForStateTransition({
      stateTransition: thirdDocumentRevision.stateTransition,
      block: thirdDocumentRevision.block,
    });

    const revertedSVDocuments = await svObjectRepository.fetch(document.getId());

    expect(revertedSVDocuments).to.be.an('array');

    const [revertedSVDocument] = revertedSVDocuments;

    expect(revertedSVDocument).to.be.an.instanceOf(SVDocument);

    expect(revertedSVDocument.getDocument().getRevision()).to.equal(1);

    expect(revertedSVDocument.getPreviousRevisions()).to.deep.equal([
      previousRevisions[0],
    ]);

    expect(readerMediatorMock.emitSerial.getCall(1)).to.have.been.calledWith(
      ReaderMediator.EVENTS.DOCUMENT_REVERTED,
      {
        userId: svObject.getUserId(),
        objectId: svObject.getDocument().getId(),
        reference: svObject.getReference(),
        object: svObject.getDocument().toJSON(),
        previousRevision: previousRevisions[1],
      },
    );
  });

  it('should not do anything if packet have no Contract ID');
});
