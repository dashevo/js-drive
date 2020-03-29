const DashPlatformProtocol = require('@dashevo/dpp');
const createDataProviderMock = require('@dashevo/dpp/lib/test/mocks/createDataProviderMock');
const getDocumentsFixture = require('@dashevo/dpp/lib/test/fixtures/getDocumentsFixture');
const getDataContractFixture = require('@dashevo/dpp/lib/test/fixtures/getDataContractFixture');
const getIdentityFixture = require('@dashevo/dpp/lib/test/fixtures/getIdentityFixture');
const getIdentityCreateSTFixture = require(
  '@dashevo/dpp/lib/test/fixtures/getIdentityCreateSTFixture',
);
const generateRandomId = require('@dashevo/dpp/lib/test/utils/generateRandomId');
const DocumentsStateTransition = require('@dashevo/dpp/lib/document/stateTransition/DocumentsStateTransition');
const DataContractStateTransition = require('@dashevo/dpp/lib/dataContract/stateTransition/DataContractStateTransition');

const IdentityAlreadyExistsError = require('@dashevo/dpp/lib/errors/IdentityAlreadyExistsError');

const IdentityPublicKey = require('@dashevo/dpp/lib/identity/IdentityPublicKey');
const { PrivateKey } = require('@dashevo/dashcore-lib');

const InvalidStateTransitionError = require('@dashevo/dpp/lib/stateTransition/errors/InvalidStateTransitionError');

const IsolatedDpp = require('../../../../../lib/dpp/isolation/dpp/IsolatedDpp');
const createIsolatedDppSnapshot = require('../../../../../lib/dpp/isolation/dpp/createIsolatedDppSnapshot');

// The regexp below explodes exponentially.
// On a string that contains 'x' with length above 30
// it will take at least several seconds on a modern hardware.
// It takes about 3 seconds with 29 symbols on 2019 16" MacBook Pro,
// And with 30 symbols it's already ~6 seconds, and with 31 symbols it's 12 sec
const exponentialPattern = '(x+x+)+y';
const stringThatExponentialyBlowsRegexp = 'x'.repeat(35);

describe('IsolatedDpp', function main() {
  this.timeout(20000);

  let isolateSnapshot;
  let isolatedDpp;
  let isolateOptions;
  let dataProviderMock;
  let dpp;

  let dataContract;
  let document;
  let identityCreateTransition;
  let identity;
  let documentsStateTransition;
  let dataContractStateTransition;

  before(async () => {
    isolateSnapshot = await createIsolatedDppSnapshot();
  });

  beforeEach(function beforeEach() {
    isolateOptions = {
      isolateOptions: {
        memoryLimit: 128,
      },
      executionOptions: {
        arguments: {
          copy: true,
        },
        result: {
          promise: true,
        },
        timeout: 5000,
      },
    };

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
    documentsStateTransition = new DocumentsStateTransition(documents);
    documentsStateTransition.sign(identityPublicKey, privateKey);

    dataContractStateTransition = new DataContractStateTransition(dataContract);
    dataContractStateTransition.sign(identityPublicKey, privateKey);

    identityCreateTransition.publicKeys = [new IdentityPublicKey({
      id: 1,
      type: IdentityPublicKey.TYPES.ECDSA_SECP256K1,
      data: privateKey.toPublicKey().toBuffer().toString('base64'),
      isEnabled: true,
    })];
    identityCreateTransition.sign(identityCreateTransition.getPublicKeys()[0], privateKey);

    dataProviderMock = createDataProviderMock(this.sinon);
    dataProviderMock.fetchDataContract.resolves(dataContract);
    dataProviderMock.fetchIdentity.resolves(identity);

    dpp = new DashPlatformProtocol({ dataProvider: dataProviderMock });

    isolatedDpp = new IsolatedDpp(dpp, isolateSnapshot, isolateOptions);
  });

  describe('stateTransition', () => {
    describe('#createFromSerialized', () => {
      describe('DocumentsStateTransition', () => {
        it('should pass through validation result', async () => {
          delete documentsStateTransition.signature;

          const serializedStateTransition = documentsStateTransition.serialize();

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
          }
        });

        it('should create state transition from serialized data', async () => {
          const serializedStateTransition = documentsStateTransition.serialize();

          const result = await isolatedDpp.stateTransition.createFromSerialized(
            serializedStateTransition,
          );

          expect(result.toJSON()).to.deep.equal(documentsStateTransition.toJSON());
        });
      });

      describe('DataContractStateTransition', () => {
        it('should pass through validation result', async () => {
          delete dataContractStateTransition.signature;

          const serializedStateTransition = dataContractStateTransition.serialize();

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
          }
        });

        it('should create state transition from serialized data', async () => {
          const serializedStateTransition = dataContractStateTransition.serialize();

          const result = await isolatedDpp.stateTransition.createFromSerialized(
            serializedStateTransition,
          );

          expect(result.toJSON()).to.deep.equal(dataContractStateTransition.toJSON());
        });
      });

      describe('IdentityCreateTransition', () => {
        it('should pass through validation result', async () => {
          delete identityCreateTransition.lockedOutPoint;

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
          }
        });

        it('should create state transition from serialized data', async () => {
          const result = await isolatedDpp.stateTransition.createFromSerialized(
            identityCreateTransition.serialize(),
          );

          expect(result.toJSON()).to.deep.equal(identityCreateTransition.toJSON());
        });
      });
    });

    describe('#validateData', () => {
      it('should act the same way as not isolated dpp does when it is valid', async () => {
        dataProviderMock
          .fetchIdentity
          .withArgs(identityCreateTransition.identityId)
          .resolves(undefined);

        const rawStateTransition = identityCreateTransition.toJSON();

        const result = await dpp.stateTransition.validateData(rawStateTransition);
        const isolatedResult = await isolatedDpp.stateTransition.validateData(
          rawStateTransition,
        );

        expect(result.isValid()).to.be.true();
        expect(result).to.deep.equal(isolatedResult);
      });

      it.skip('should act the same way as not isolated dpp does when it is not valid', async () => {
        dataProviderMock
          .fetchIdentity
          .withArgs(identityCreateTransition.getIdentityId())
          .resolves(identity);

        {
          const result = await dpp.stateTransition.validateData(identityCreateTransition);

          const [e] = result.getErrors();
          expect(e).to.be.an.instanceOf(IdentityAlreadyExistsError);
        }

        {
          const result = await isolatedDpp.stateTransition.validateData(identityCreateTransition);

          const [e] = result.getErrors();
          expect(e).to.be.an.instanceOf(IdentityAlreadyExistsError);
        }
      });
    });
  });

  it('should stop execution if dpp validation takes too much time', async () => {
    const idenitity = getIdentityFixture();
    const privateKey = new PrivateKey();
    const identityPublicKey = new IdentityPublicKey({
      id: 101,
      type: IdentityPublicKey.TYPES.ECDSA_SECP256K1,
      data: privateKey.toPublicKey().toBuffer().toString('base64'),
      isEnabled: true,
    });
    idenitity.publicKeys.push(identityPublicKey);
    // Identity init

    // Creating dangerous contract fixture
    const contractId = generateRandomId();
    const dangerousDocSchema = {
      doc: {
        properties: {
          str: {
            type: 'string',
            pattern: exponentialPattern,
          },
        },
        additionalProperties: false,
      },
    };
    const contract = await dpp.dataContract.create(contractId, dangerousDocSchema);
    dataProviderMock.fetchDataContract.resolves(contract);
    const exponentialDoc = await dpp.document.create(
      contract,
      idenitity.getId(),
      'doc',
      { str: stringThatExponentialyBlowsRegexp },
    );

    // Creating document that exploits dangerous contract
    const documentSt = await dpp.document.createStateTransition([exponentialDoc]);
    documentSt.sign(identityPublicKey, privateKey);

    const st = documentSt.serialize().toString('hex');

    const start = Date.now();
    let error;
    try {
      await isolatedDpp.stateTransition.createFromSerialized(st);
    } catch (e) {
      error = e;
    }
    const end = Date.now();

    expect(error).to.be.instanceOf(Error);
    expect(error.message).to.be.equal('Script execution timed out.');

    expect(isolateOptions.executionOptions.timeout).to.be.equal(5000);
    expect(end - start).to.be.greaterThan(isolateOptions.executionOptions.timeout);
    expect(end - start).to.be.lessThan(isolateOptions.executionOptions.timeout + 1000);
  });
});
