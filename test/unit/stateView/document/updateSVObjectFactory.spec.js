const Document = require('@dashevo/dpp/lib/document/Document');
const SVObject = require('../../../../lib/stateView/document/SVObject');

const Revision = require('../../../../lib/stateView/revisions/Revision');

const updateSVObjectFactory = require('../../../../lib/stateView/document/updateSVObjectFactory');

const getReferenceFixture = require('../../../../lib/test/fixtures/getReferenceFixture');
const getDocumentsFixture = require('../../../../lib/test/fixtures/getDocumentsFixture');
const getSVObjectsFixture = require('../../../../lib/test/fixtures/getSVObjectsFixture');

describe('updateSVObjectFactory', () => {
  let svObjectRepository;
  let updateSVObject;
  let reference;
  let document;
  let userId;
  let contractId;

  beforeEach(function beforeEach() {
    svObjectRepository = {
      find: this.sinon.stub(),
      store: this.sinon.stub(),
    };

    contractId = 'b8ae412cdeeb4bb39ec496dec34495ecccaf74f9fa9eaa712c77a03eb1994e75';
    ({ userId } = getDocumentsFixture);
    [document] = getDocumentsFixture();

    const createSVObjectRepository = () => svObjectRepository;

    updateSVObject = updateSVObjectFactory(createSVObjectRepository);

    reference = getReferenceFixture();
  });

  it('should store SVObject if action is "create"', async () => {
    await updateSVObject(contractId, userId, reference, document);

    expect(svObjectRepository.store).to.have.been.calledOnce();

    const svObject = svObjectRepository.store.getCall(0).args[0];

    expect(svObject).to.be.an.instanceOf(SVObject);
    expect(svObject.getUserId()).to.equal(userId);
    expect(svObject.getDocument()).to.equal(document);
    expect(svObject.getReference()).to.equal(reference);
    expect(svObject.getPreviousRevisions()).to.deep.equal([]);
    expect(svObject.isDeleted()).to.be.false();
  });

  it('should store SVObject if action is "update" and it has a previous version', async () => {
    const [previousSVObject] = getSVObjectsFixture();

    svObjectRepository.find.returns(previousSVObject);

    document.setRevision(1);
    document.setAction(Document.ACTIONS.UPDATE);

    await updateSVObject(contractId, userId, reference, document);

    expect(svObjectRepository.find).to.have.been.calledOnceWith(document.getId());
    expect(svObjectRepository.store).to.have.been.calledOnce();

    const svObject = svObjectRepository.store.getCall(0).args[0];

    expect(svObject).to.be.an.instanceOf(SVObject);
    expect(svObject.getUserId()).to.equal(userId);
    expect(svObject.getDocument()).to.equal(document);
    expect(svObject.getReference()).to.equal(reference);
    expect(svObject.getPreviousRevisions()).to.deep.equal([
      previousSVObject.getCurrentRevision(),
    ]);
    expect(svObject.isDeleted()).to.be.false();
  });

  it('should throw an error if action is "update" and there is no previous version', async () => {
    svObjectRepository.find.returns(null);

    document.setAction(Document.ACTIONS.UPDATE);

    let error;
    try {
      await updateSVObject(contractId, userId, reference, document);
    } catch (e) {
      error = e;
    }

    expect(error).to.be.an.instanceOf(Error);

    expect(svObjectRepository.find).to.have.been.calledOnceWith(document.getId());
    expect(svObjectRepository.store).to.have.not.been.called();
  });

  it('should store SVObject and remove ahead versions if action is "update" upon reverting', async () => {
    const previousRevisions = [
      new Revision(0, reference),
      new Revision(1, reference),
      new Revision(2, reference),
      new Revision(3, reference),
    ];

    const isDeleted = false;

    const previousSVObject = new SVObject(
      userId,
      document,
      reference,
      isDeleted,
      previousRevisions,
    );

    svObjectRepository.find.returns(previousSVObject);

    document.setAction(Document.ACTIONS.UPDATE);
    document.setRevision(2);

    await updateSVObject(contractId, userId, reference, document, true);

    expect(svObjectRepository.find).to.have.been.calledOnceWith(document.getId());
    expect(svObjectRepository.store).to.have.been.calledOnce();

    const svObject = svObjectRepository.store.getCall(0).args[0];

    expect(svObject).to.be.an.instanceOf(SVObject);
    expect(svObject.getUserId()).to.equal(userId);
    expect(svObject.getDocument()).to.equal(document);
    expect(svObject.getReference()).to.equal(reference);
    expect(svObject.getPreviousRevisions()).to.deep.equal(previousRevisions.slice(0, 2));
    expect(svObject.isDeleted()).to.be.false();
  });

  it('should delete SVObject if action is "delete"', async () => {
    const [previousSVObject] = getSVObjectsFixture();

    svObjectRepository.find.returns(previousSVObject);

    document.setRevision(1);
    document.setData({});
    document.setAction(Document.ACTIONS.DELETE);

    await updateSVObject(contractId, userId, reference, document);

    expect(svObjectRepository.store).to.have.been.calledOnce();

    const svObject = svObjectRepository.store.getCall(0).args[0];

    expect(svObject).to.be.an.instanceOf(SVObject);
    expect(svObject.getUserId()).to.equal(userId);
    expect(svObject.getDocument()).to.equal(document);
    expect(svObject.getReference()).to.equal(reference);
    expect(svObject.getPreviousRevisions()).to.deep.equal([
      previousSVObject.getCurrentRevision(),
    ]);
    expect(svObject.isDeleted()).to.be.true();
  });


  it('should throw an error if action is not supported', async () => {
    document.setAction(100);

    let error;
    try {
      await updateSVObject(contractId, userId, reference, document);
    } catch (e) {
      error = e;
    }

    expect(error).to.be.an.instanceOf(Error);

    expect(svObjectRepository.store).to.have.not.been.called();
  });
});
