const getIdentityFixture = require('@dashevo/dpp/lib/test/fixtures/getIdentityFixture');
const createStateRepositoryMock = require('@dashevo/dpp/lib/test/mocks/createStateRepositoryMock');
const getDataContractFixture = require('@dashevo/dpp/lib/test/fixtures/getDataContractFixture');
const getDocumentsFixture = require('@dashevo/dpp/lib/test/fixtures/getDocumentsFixture');

const LoggedStateRepositoryDecorator = require('../../../lib/dpp/LoggedStateRepositoryDecorator');

describe('LoggedStateRepositoryDecorator', () => {
  let loggedStateRepositoryDecorator;
  let stateRepositoryMock;
  let loggerMock;

  beforeEach(function beforeEach() {
    stateRepositoryMock = createStateRepositoryMock(this.sinon);
    loggerMock = {
      debug: this.sinon.stub(),
    };

    loggedStateRepositoryDecorator = new LoggedStateRepositoryDecorator(
      stateRepositoryMock,
      loggerMock,
    );
  });

  describe('#writeToDebugLog', () => {
    it('should call logger', () => {
      const method = 'methodName';
      const parameters = { method };
      const response = { result: true };

      loggedStateRepositoryDecorator.writeToDebugLog(method, parameters, response);

      expect(loggerMock.debug).to.be.calledOnceWithExactly({
        method,
        parameters,
        response,
      }, `StateRepository#${method} called`);
    });
  });

  describe('#fetchIdentity', () => {
    let id;
    beforeEach(() => {
      id = 1;
    });

    it('should call logger with proper params', async () => {
      const response = 'response';

      stateRepositoryMock.fetchIdentity.resolves(response);

      await loggedStateRepositoryDecorator.fetchIdentity(id);

      expect(loggerMock.debug).to.be.calledOnceWithExactly({
        method: 'fetchIdentity',
        parameters: { id },
        response,
      }, 'StateRepository#fetchIdentity called');
    });

    it('should call logger in case of error', async () => {
      const error = new Error('unknown error');

      stateRepositoryMock.fetchIdentity.throws(error);

      try {
        await loggedStateRepositoryDecorator.fetchIdentity(id);

        expect.fail('should throw an error');
      } catch (e) {
        expect(e).equals(error);
      }

      expect(loggerMock.debug).to.be.calledOnceWithExactly({
        method: 'fetchIdentity',
        parameters: { id },
        response: undefined,
      }, 'StateRepository#fetchIdentity called');
    });
  });

  describe('#storeIdentity', () => {
    let identity;
    beforeEach(() => {
      identity = getIdentityFixture();
    });

    it('should call logger with proper params', async () => {
      const response = 'response';

      stateRepositoryMock.storeIdentity.resolves(response);

      await loggedStateRepositoryDecorator.storeIdentity(identity);

      expect(loggerMock.debug).to.be.calledOnceWithExactly({
        method: 'storeIdentity',
        parameters: { identity },
        response,
      }, 'StateRepository#storeIdentity called');
    });

    it('should call logger in case of error', async () => {
      const error = new Error('unknown error');

      stateRepositoryMock.storeIdentity.throws(error);

      try {
        await loggedStateRepositoryDecorator.storeIdentity(identity);

        expect.fail('should throw an error');
      } catch (e) {
        expect(e).equals(error);
      }

      expect(loggerMock.debug).to.be.calledOnceWithExactly({
        method: 'storeIdentity',
        parameters: { identity },
        response: undefined,
      }, 'StateRepository#storeIdentity called');
    });
  });

  describe('#storePublicKeyIdentityId', () => {
    let publicKeyHash;
    let identityId;

    beforeEach(() => {
      publicKeyHash = 'publicKeyHash';
      identityId = 'identityId';
    });

    it('should call logger with proper params', async function it() {
      const response = 'response';

      stateRepositoryMock.storePublicKeyIdentityId = this.sinon.stub().resolves(response);

      await loggedStateRepositoryDecorator.storePublicKeyIdentityId(publicKeyHash, identityId);

      expect(loggerMock.debug).to.be.calledOnceWithExactly({
        method: 'storePublicKeyIdentityId',
        parameters: { publicKeyHash, identityId },
        response,
      }, 'StateRepository#storePublicKeyIdentityId called');
    });

    it('should call logger in case of error', async function it() {
      const error = new Error('unknown error');

      stateRepositoryMock.storePublicKeyIdentityId = this.sinon.stub().throws(error);

      try {
        await loggedStateRepositoryDecorator.storePublicKeyIdentityId(publicKeyHash, identityId);

        expect.fail('should throw an error');
      } catch (e) {
        expect(e).equals(error);
      }

      expect(loggerMock.debug).to.be.calledOnceWithExactly({
        method: 'storePublicKeyIdentityId',
        parameters: { publicKeyHash, identityId },
        response: undefined,
      }, 'StateRepository#storePublicKeyIdentityId called');
    });
  });

  describe('#storeIdentityPublicKeyHashes', () => {
    let identityId;
    let publicKeyHashes;

    beforeEach(() => {
      identityId = 'identityId';
      publicKeyHashes = ['publicKeyHashes'];
    });

    it('should call logger with proper params', async () => {
      const response = 'response';

      stateRepositoryMock.storeIdentityPublicKeyHashes.resolves(response);

      await loggedStateRepositoryDecorator
        .storeIdentityPublicKeyHashes(identityId, publicKeyHashes);

      expect(loggerMock.debug).to.be.calledOnceWithExactly({
        method: 'storeIdentityPublicKeyHashes',
        parameters: { identityId, publicKeyHashes },
        response,
      }, 'StateRepository#storeIdentityPublicKeyHashes called');
    });

    it('should call logger in case of error', async () => {
      const error = new Error('unknown error');

      stateRepositoryMock.storeIdentityPublicKeyHashes.throws(error);

      try {
        await loggedStateRepositoryDecorator
          .storeIdentityPublicKeyHashes(identityId, publicKeyHashes);

        expect.fail('should throw an error');
      } catch (e) {
        expect(e).equals(error);
      }

      expect(loggerMock.debug).to.be.calledOnceWithExactly({
        method: 'storeIdentityPublicKeyHashes',
        parameters: { identityId, publicKeyHashes },
        response: undefined,
      }, 'StateRepository#storeIdentityPublicKeyHashes called');
    });
  });

  describe('#fetchPublicKeyIdentityId', () => {
    let publicKeyHash;

    beforeEach(() => {
      publicKeyHash = 'publicKeyHash';
    });

    it('should call logger with proper params', async function it() {
      const response = 'response';

      stateRepositoryMock.fetchPublicKeyIdentityId = this.sinon.stub().resolves(response);

      await loggedStateRepositoryDecorator.fetchPublicKeyIdentityId(publicKeyHash);

      expect(loggerMock.debug).to.be.calledOnceWithExactly({
        method: 'fetchPublicKeyIdentityId',
        parameters: { publicKeyHash },
        response,
      }, 'StateRepository#fetchPublicKeyIdentityId called');
    });

    it('should call logger in case of error', async function it() {
      const error = new Error('unknown error');

      stateRepositoryMock.fetchPublicKeyIdentityId = this.sinon.stub().throws(error);

      try {
        await loggedStateRepositoryDecorator.fetchPublicKeyIdentityId(publicKeyHash);

        expect.fail('should throw an error');
      } catch (e) {
        expect(e).equals(error);
      }

      expect(loggerMock.debug).to.be.calledOnceWithExactly({
        method: 'fetchPublicKeyIdentityId',
        parameters: { publicKeyHash },
        response: undefined,
      }, 'StateRepository#fetchPublicKeyIdentityId called');
    });
  });

  describe('#fetchIdentityIdsByPublicKeyHashes', () => {
    let publicKeyHashes;

    beforeEach(() => {
      publicKeyHashes = ['publicKeyHashes'];
    });

    it('should call logger with proper params', async () => {
      const response = 'response';

      stateRepositoryMock.fetchIdentityIdsByPublicKeyHashes.resolves(response);

      await loggedStateRepositoryDecorator.fetchIdentityIdsByPublicKeyHashes(publicKeyHashes);

      expect(loggerMock.debug).to.be.calledOnceWithExactly({
        method: 'fetchIdentityIdsByPublicKeyHashes',
        parameters: { publicKeyHashes },
        response,
      }, 'StateRepository#fetchIdentityIdsByPublicKeyHashes called');
    });

    it('should call logger in case of error', async () => {
      const error = new Error('unknown error');

      stateRepositoryMock.fetchIdentityIdsByPublicKeyHashes.throws(error);

      try {
        await loggedStateRepositoryDecorator.fetchIdentityIdsByPublicKeyHashes(publicKeyHashes);

        expect.fail('should throw an error');
      } catch (e) {
        expect(e).equals(error);
      }

      expect(loggerMock.debug).to.be.calledOnceWithExactly({
        method: 'fetchIdentityIdsByPublicKeyHashes',
        parameters: { publicKeyHashes },
        response: undefined,
      }, 'StateRepository#fetchIdentityIdsByPublicKeyHashes called');
    });
  });

  describe('#fetchDataContract', () => {
    let id;

    beforeEach(() => {
      id = 'id';
    });

    it('should call logger with proper params', async () => {
      const response = 'response';

      stateRepositoryMock.fetchDataContract.resolves(response);

      await loggedStateRepositoryDecorator.fetchDataContract(id);

      expect(loggerMock.debug).to.be.calledOnceWithExactly({
        method: 'fetchDataContract',
        parameters: { id },
        response,
      }, 'StateRepository#fetchDataContract called');
    });

    it('should call logger in case of error', async () => {
      const error = new Error('unknown error');

      stateRepositoryMock.fetchDataContract.throws(error);

      try {
        await loggedStateRepositoryDecorator.fetchDataContract(id);

        expect.fail('should throw an error');
      } catch (e) {
        expect(e).equals(error);
      }

      expect(loggerMock.debug).to.be.calledOnceWithExactly({
        method: 'fetchDataContract',
        parameters: { id },
        response: undefined,
      }, 'StateRepository#fetchDataContract called');
    });
  });

  describe('#storeDataContract', () => {
    let dataContract;

    beforeEach(() => {
      dataContract = getDataContractFixture();
    });

    it('should call logger with proper params', async () => {
      const response = 'response';

      stateRepositoryMock.storeDataContract.resolves(response);

      await loggedStateRepositoryDecorator.storeDataContract(dataContract);

      expect(loggerMock.debug).to.be.calledOnceWithExactly({
        method: 'storeDataContract',
        parameters: { dataContract },
        response,
      }, 'StateRepository#storeDataContract called');
    });

    it('should call logger in case of error', async () => {
      const error = new Error('unknown error');

      stateRepositoryMock.storeDataContract.throws(error);

      try {
        await loggedStateRepositoryDecorator.storeDataContract(dataContract);

        expect.fail('should throw an error');
      } catch (e) {
        expect(e).equals(error);
      }

      expect(loggerMock.debug).to.be.calledOnceWithExactly({
        method: 'storeDataContract',
        parameters: { dataContract },
        response: undefined,
      }, 'StateRepository#storeDataContract called');
    });
  });

  describe('#fetchDocuments', () => {
    let contractId;
    let type;
    let options;

    beforeEach(() => {
      contractId = 'contractId';
      type = 'type';
      options = {
        option1: 'some option',
      };
    });

    it('should call logger with proper params', async () => {
      const response = 'response';

      stateRepositoryMock.fetchDocuments.resolves(response);

      await loggedStateRepositoryDecorator.fetchDocuments(contractId, type, options);

      expect(loggerMock.debug).to.be.calledOnceWithExactly({
        method: 'fetchDocuments',
        parameters: { contractId, type, options },
        response,
      }, 'StateRepository#fetchDocuments called');
    });

    it('should call logger in case of error', async () => {
      const error = new Error('unknown error');

      stateRepositoryMock.fetchDocuments.throws(error);

      try {
        await loggedStateRepositoryDecorator.fetchDocuments(contractId, type, options);

        expect.fail('should throw an error');
      } catch (e) {
        expect(e).equals(error);
      }

      expect(loggerMock.debug).to.be.calledOnceWithExactly({
        method: 'fetchDocuments',
        parameters: { contractId, type, options },
        response: undefined,
      }, 'StateRepository#fetchDocuments called');
    });
  });

  describe('#storeDocument', () => {
    let document;

    beforeEach(() => {
      [document] = getDocumentsFixture();
    });

    it('should call logger with proper params', async () => {
      const response = 'response';

      stateRepositoryMock.storeDocument.resolves(response);

      await loggedStateRepositoryDecorator.storeDocument(document);

      expect(loggerMock.debug).to.be.calledOnceWithExactly({
        method: 'storeDocument',
        parameters: { document },
        response,
      }, 'StateRepository#storeDocument called');
    });

    it('should call logger in case of error', async () => {
      const error = new Error('unknown error');

      stateRepositoryMock.storeDocument.throws(error);

      try {
        await loggedStateRepositoryDecorator.storeDocument(document);

        expect.fail('should throw an error');
      } catch (e) {
        expect(e).equals(error);
      }

      expect(loggerMock.debug).to.be.calledOnceWithExactly({
        method: 'storeDocument',
        parameters: { document },
        response: undefined,
      }, 'StateRepository#storeDocument called');
    });
  });

  describe('#removeDocument', () => {
    let contractId;
    let type;
    let id;

    beforeEach(() => {
      contractId = 'contractId';
      type = 'type';
      id = 'id';
    });

    it('should call logger with proper params', async () => {
      const response = 'response';

      stateRepositoryMock.removeDocument.resolves(response);

      await loggedStateRepositoryDecorator.removeDocument(contractId, type, id);

      expect(loggerMock.debug).to.be.calledOnceWithExactly({
        method: 'removeDocument',
        parameters: { contractId, type, id },
        response,
      }, 'StateRepository#removeDocument called');
    });

    it('should call logger in case of error', async () => {
      const error = new Error('unknown error');

      stateRepositoryMock.removeDocument.throws(error);

      try {
        await loggedStateRepositoryDecorator.removeDocument(contractId, type, id);

        expect.fail('should throw an error');
      } catch (e) {
        expect(e).equals(error);
      }

      expect(loggerMock.debug).to.be.calledOnceWithExactly({
        method: 'removeDocument',
        parameters: { contractId, type, id },
        response: undefined,
      }, 'StateRepository#removeDocument called');
    });
  });

  describe('#fetchTransaction', () => {
    let id;

    beforeEach(() => {
      id = 'id';
    });

    it('should call logger with proper params', async () => {
      const response = 'response';

      stateRepositoryMock.fetchTransaction.resolves(response);

      await loggedStateRepositoryDecorator.fetchTransaction(id);

      expect(loggerMock.debug).to.be.calledOnceWithExactly({
        method: 'fetchTransaction',
        parameters: { id },
        response,
      }, 'StateRepository#fetchTransaction called');
    });

    it('should call logger in case of error', async () => {
      const error = new Error('unknown error');

      stateRepositoryMock.fetchTransaction.throws(error);

      try {
        await loggedStateRepositoryDecorator.fetchTransaction(id);

        expect.fail('should throw an error');
      } catch (e) {
        expect(e).equals(error);
      }

      expect(loggerMock.debug).to.be.calledOnceWithExactly({
        method: 'fetchTransaction',
        parameters: { id },
        response: undefined,
      }, 'StateRepository#fetchTransaction called');
    });
  });

  describe('#fetchLatestPlatformBlockHeader', () => {
    it('should call logger with proper params', async () => {
      const response = 'response';

      stateRepositoryMock.fetchLatestPlatformBlockHeader.resolves(response);

      await loggedStateRepositoryDecorator.fetchLatestPlatformBlockHeader();

      expect(loggerMock.debug).to.be.calledOnceWithExactly({
        method: 'fetchLatestPlatformBlockHeader',
        parameters: { },
        response,
      }, 'StateRepository#fetchLatestPlatformBlockHeader called');
    });

    it('should call logger in case of error', async () => {
      const error = new Error('unknown error');

      stateRepositoryMock.fetchLatestPlatformBlockHeader.throws(error);

      try {
        await loggedStateRepositoryDecorator.fetchLatestPlatformBlockHeader();

        expect.fail('should throw an error');
      } catch (e) {
        expect(e).equals(error);
      }

      expect(loggerMock.debug).to.be.calledOnceWithExactly({
        method: 'fetchLatestPlatformBlockHeader',
        parameters: { },
        response: undefined,
      }, 'StateRepository#fetchLatestPlatformBlockHeader called');
    });
  });
});
