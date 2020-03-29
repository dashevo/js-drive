const { startMongoDb } = require('@dashevo/dp-services-ctl');

const createDIContainer = require('../../lib/createDIContainer');

describe('createDIContainer', function describeContainer() {
  this.timeout(25000);

  let container;
  let mongoDB;
  let documentsMongoDBUrl;

  before(async () => {
    mongoDB = await startMongoDb();

    documentsMongoDBUrl = `mongodb://127.0.0.1:${mongoDB.options.getMongoPort()}`
    + `/?replicaSet=${mongoDB.options.options.replicaSetName}`;
  });

  after(async () => {
    await mongoDB.remove();
  });

  beforeEach(async () => {
    container = await createDIContainer({
      ...process.env,
      DOCUMENTS_MONGODB_URL: documentsMongoDBUrl,
    });
  });

  afterEach(async () => {
    if (container) {
      await container.dispose();
    }
  });

  it('should create DI container', async () => {
    expect(container).to.respondTo('register');
    expect(container).to.respondTo('resolve');
  });

  describe('container', () => {
    it('should resolve abciHandlers', () => {
      const abciHandlers = container.resolve('abciHandlers');

      expect(abciHandlers).to.have.property('info');
      expect(abciHandlers).to.have.property('checkTx');
      expect(abciHandlers).to.have.property('beginBlock');
      expect(abciHandlers).to.have.property('deliverTx');
      expect(abciHandlers).to.have.property('commit');
      expect(abciHandlers).to.have.property('query');
    });
  });
});
