const createDataProviderMock = require('@dashevo/dpp/lib/test/mocks/createDataProviderMock');
const getDocumentsFixture = require('@dashevo/dpp/lib/test/fixtures/getDocumentsFixture');
const getDataContractFixture = require('@dashevo/dpp/lib/test/fixtures/getDataContractFixture');
const getIdentityFixture = require('@dashevo/dpp/lib/test/fixtures/getIdentityFixture');
const getIdentityCreateSTFixture = require(
  '@dashevo/dpp/lib/test/fixtures/getIdentityCreateSTFixture',
);
const getDocumentTransitionsFixture = require('@dashevo/dpp/lib/test/fixtures/getDocumentTransitionsFixture');
const DocumentsBatchTransition = require('@dashevo/dpp/lib/document/stateTransition/DocumentsBatchTransition');
const DataContractCreateTransition = require('@dashevo/dpp/lib/dataContract/stateTransition/DataContractCreateTransition');

const IdentityPublicKey = require('@dashevo/dpp/lib/identity/IdentityPublicKey');
const { PrivateKey } = require('@dashevo/dashcore-lib');

const InvalidStateTransitionError = require('@dashevo/dpp/lib/stateTransition/errors/InvalidStateTransitionError');

const createIsolatedValidatorSnapshot = require('../../../../../lib/dpp/isolation/validator/createIsolatedValidatorSnapshot');
const createIsolatedDppFactory = require('../../../../../lib/dpp/isolation/validator/createIsolatedDppFactory');

describe('createIsolatedDpp', () => {
  let dataContract;
  let document;
  let identityCreateTransition;
  let identity;
  let documentsBatchTransition;
  let dataContractCreateTransition;

  let dataProviderMock;
  let createIsolatedDpp;
  let isolatedValidatorSnapshot;

  before(async () => {
    isolatedValidatorSnapshot = await createIsolatedValidatorSnapshot();
  });

  beforeEach(async function createFixturesAndMocks() {
    const privateKey = new PrivateKey();
    const publicKey = privateKey.toPublicKey().toBuffer().toString('base64');
    const publicKeyId = 1;

    const identityPublicKey = new IdentityPublicKey()
      .setId(publicKeyId)
      .setType(IdentityPublicKey.TYPES.ECDSA_SECP256K1)
      .setData(publicKey);

    dataContract = getDataContractFixture();
    const documents = getDocumentsFixture();
    [document] = documents;
    document.contractId = dataContract.getId();
    identity = getIdentityFixture();
    identity.type = 2;
    identity.publicKeys = [
      identityPublicKey,
    ];

    identityCreateTransition = getIdentityCreateSTFixture();

    const documentTransitions = getDocumentTransitionsFixture(documents);
    documentsBatchTransition = new DocumentsBatchTransition({
      ownerId: getDocumentsFixture.ownerId,
      contractId: getDocumentsFixture.dataContract.getId(),
      transitions: documentTransitions.map(t => t.toJSON()),
    });
    documentsBatchTransition.sign(identityPublicKey, privateKey);

    dataContractCreateTransition = new DataContractCreateTransition({
      dataContract: dataContract.toJSON(),
      entropy: dataContract.getEntropy(),
    });
    dataContractCreateTransition.sign(identityPublicKey, privateKey);

    identityCreateTransition.publicKeys = [new IdentityPublicKey({
      id: 1,
      type: IdentityPublicKey.TYPES.ECDSA_SECP256K1,
      data: privateKey.toPublicKey().toBuffer().toString('base64'),
      isEnabled: true,
    })];
    identityCreateTransition.signByPrivateKey(privateKey);

    dataProviderMock = createDataProviderMock(this.sinon);
    dataProviderMock.fetchDataContract.resolves(dataContract);
    dataProviderMock.fetchIdentity.resolves(identity);

    createIsolatedDpp = createIsolatedDppFactory(
      isolatedValidatorSnapshot,
      { memoryLimit: 10, timeout: 300 },
      dataProviderMock,
    );
  });

  describe('stateTransition', () => {
    describe('#createFromSerialized', () => {
      describe('DocumentsStateTransition', () => {
        it('should pass through validation result', async () => {
          delete documentsBatchTransition.signature;

          const serializedDocumentsStateTransition = documentsBatchTransition.serialize();

          const isolatedDpp = await createIsolatedDpp();

          try {
            await isolatedDpp.stateTransition.createFromSerialized(
              serializedDocumentsStateTransition,
            );

            expect.fail('Error was not thrown');
          } catch (e) {
            expect(e).to.be.an.instanceOf(InvalidStateTransitionError);

            const [error] = e.getErrors();
            expect(error.name).to.equal('JsonSchemaError');
            expect(error.params.missingProperty).to.equal('signature');
          } finally {
            isolatedDpp.dispose();
          }
        });

        it('should create state transition from serialized data', async () => {
          const serializedDocumentsStateTransition = documentsBatchTransition.serialize();

          const isolatedDpp = await createIsolatedDpp();

          try {
            const result = await isolatedDpp.stateTransition.createFromSerialized(
              serializedDocumentsStateTransition,
            );

            expect(result.toJSON()).to.deep.equal(documentsBatchTransition.toJSON());
          } finally {
            isolatedDpp.dispose();
          }
        });
      });

      describe('DataContractStateTransition', () => {
        it('should pass through validation result', async () => {
          delete dataContractCreateTransition.signature;

          const serializedStateTransition = dataContractCreateTransition.serialize();

          const isolatedDpp = await createIsolatedDpp();

          try {
            await isolatedDpp.stateTransition.createFromSerialized(
              serializedStateTransition,
            );

            expect.fail('Error was not thrown');
          } catch (e) {
            expect(e).to.be.an.instanceOf(InvalidStateTransitionError);

            const [error] = e.getErrors();
            expect(error.name).to.equal('JsonSchemaError');
            expect(error.params.missingProperty).to.equal('signature');
          } finally {
            isolatedDpp.dispose();
          }
        });

        it('should create state transition from serialized data', async () => {
          const serializedStateTransition = dataContractCreateTransition.serialize();

          const isolatedDpp = await createIsolatedDpp();

          try {
            const result = await isolatedDpp.stateTransition.createFromSerialized(
              serializedStateTransition,
            );

            expect(result.toJSON()).to.deep.equal(dataContractCreateTransition.toJSON());
          } finally {
            isolatedDpp.dispose();
          }
        });
      });

      describe('IdentityCreateTransition', () => {
        it('should pass through validation result', async () => {
          delete identityCreateTransition.lockedOutPoint;

          const isolatedDpp = await createIsolatedDpp();

          try {
            await isolatedDpp.stateTransition.createFromSerialized(
              identityCreateTransition.serialize(),
            );
            expect.fail('Error was not thrown');
          } catch (e) {
            expect(e).to.be.an.instanceOf(InvalidStateTransitionError);

            const [error] = e.getErrors();
            expect(error.name).to.equal('JsonSchemaError');
            expect(error.params.missingProperty).to.equal('lockedOutPoint');
          } finally {
            isolatedDpp.dispose();
          }
        });

        it('should create state transition from serialized data', async () => {
          const isolatedDpp = await createIsolatedDpp();

          try {
            const result = await isolatedDpp.stateTransition.createFromSerialized(
              identityCreateTransition.serialize(),
            );

            expect(result.toJSON()).to.deep.equal(identityCreateTransition.toJSON());
          } finally {
            isolatedDpp.dispose();
          }
        });
      });
    });
  });
});
