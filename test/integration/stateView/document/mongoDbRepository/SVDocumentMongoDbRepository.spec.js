const { mocha: { startMongoDb } } = require('@dashevo/dp-services-ctl');

const SVDocument = require('../../../../../lib/stateView/document/SVDocument');
const SVDocumentMongoDbRepository = require('../../../../../lib/stateView/document/mongoDbRepository/SVDocumentMongoDbRepository');

const sanitizer = require('../../../../../lib/mongoDb/sanitizer');
const convertWhereToMongoDbQuery = require('../../../../../lib/stateView/document/mongoDbRepository/convertWhereToMongoDbQuery');
const validateQueryFactory = require('../../../../../lib/stateView/document/query/validateQueryFactory');
const findConflictingConditions = require('../../../../../lib/stateView/document/query/findConflictingConditions');

const getSVDocumentsFixture = require('../../../../../lib/test/fixtures/getSVDocumentsFixture');

function sortAndJsonizeSVDocuments(svDocuments) {
  return svDocuments.sort((prev, next) => (
    prev.getDocument().getId() > next.getDocument().getId()
  )).map(d => d.toJSON());
}

describe('SVDocumentMongoDbRepository', function main() {
  this.timeout(10000);

  let svDocumentRepository;
  let svDocument;
  let svDocuments;
  let mongoDatabase;

  startMongoDb().then((mongoDb) => {
    mongoDatabase = mongoDb.getDb();
  });

  beforeEach(async () => {
    svDocuments = getSVDocumentsFixture();
    [svDocument] = svDocuments;

    const validateQuery = validateQueryFactory(findConflictingConditions);

    svDocumentRepository = new SVDocumentMongoDbRepository(
      mongoDatabase,
      sanitizer,
      convertWhereToMongoDbQuery,
      validateQuery,
      svDocument.getDocument().getType(),
    );

    await Promise.all(
      svDocuments.map(o => svDocumentRepository.store(o)),
    );
  });

  describe('#store', () => {
    it('should store SVDocument', async () => {
      const result = await svDocumentRepository.find(svDocument.getDocument().getId());

      expect(result).to.be.an.instanceOf(SVDocument);
      expect(result.toJSON()).to.deep.equal(svDocument.toJSON());
    });
  });

  describe('#fetch', () => {
    it('should fetch SVDocuments', async () => {
      const result = await svDocumentRepository.fetch();

      expect(result).to.be.an('array');

      const actualRawSVDocuments = sortAndJsonizeSVDocuments(result);
      const expectedRawSVDocuments = sortAndJsonizeSVDocuments(svDocuments);

      expect(actualRawSVDocuments).to.have.deep.members(expectedRawSVDocuments);
    });

    it('should throw InvalidQueryError if query is not valid');

    it('should not fetch SVDocument that is marked as deleted');

    describe('where', () => {
      it('should find SVDocuments using "<" operator');
      it('should find SVDocuments using "<=" operator');

      it('should find SVDocuments using "==" operator', async () => {
        const query = {
          where: [['name', '==', svDocument.getDocument().get('name')]],
        };

        const result = await svDocumentRepository.fetch(query);

        expect(result).to.be.an('array');
        expect(result).to.be.lengthOf(1);

        const [expectedSVDocument] = result;

        expect(expectedSVDocument.toJSON()).to.deep.equal(svDocument.toJSON());
      });

      it('should find SVDocuments using ">" operator');
      it('should find SVDocuments using ">=" operator');
      it('should find SVDocuments using "in" operator');
      it('should find SVDocuments using "length" operator');
      it('should find SVDocuments using "startsWith" operator');
      it('should find SVDocuments using "elementMatch" operator');
      it('should find SVDocuments using "contains" operator and array value');
      it('should find SVDocuments using "contains" operator and scalar value');

      it('should return empty array if where clause conditions do not match', async () => {
        const query = {
          where: [['name', '==', 'Dash enthusiast']],
        };

        const result = await svDocumentRepository.fetch(query);

        expect(result).to.deep.equal([]);
      });

      it('should find SVDocuments by nested object fields');

      it('should return SVDocuments by several conditions');
    });

    describe('limit', () => {
      it('should limit return to 1 SVDocument if limit is set', async () => {
        const options = {
          limit: 1,
        };

        const result = await svDocumentRepository.fetch(options);

        expect(result).to.be.an('array');
        expect(result).to.have.lengthOf(1);
      });


      it('should limit return to 100 SVDocuments if limit is not set');
    });

    describe('startAt', () => {
      it('should return SVDocuments from 2 document', async () => {
        svDocuments.forEach((d, i) => d.getDocument().set('age', i + 1));

        await Promise.all(
          svDocuments.map(o => svDocumentRepository.store(o)),
        );

        const query = {
          orderBy: [
            ['age', 'asc'],
          ],
          startAt: 2,
        };

        const result = await svDocumentRepository.fetch(query);

        expect(result).to.be.an('array');

        const actualRawSVDocuments = result.map(d => d.toJSON());
        const expectedRawSVDocuments = svDocuments.splice(1).map(d => d.toJSON());

        expect(actualRawSVDocuments).to.deep.equal(expectedRawSVDocuments);
      });
    });

    describe('startAfter', () => {
      it('should return SVDocuments after 1 document', async () => {
        svDocuments.forEach((d, i) => d.getDocument().set('age', i + 1));

        await Promise.all(
          svDocuments.map(o => svDocumentRepository.store(o)),
        );

        const options = {
          orderBy: [
            ['age', 'asc'],
          ],
          startAfter: 1,
        };

        const result = await svDocumentRepository.fetch(options);

        expect(result).to.be.an('array');

        const actualRawSVDocuments = result.map(d => d.toJSON());
        const expectedRawSVDocuments = svDocuments.splice(1).map(d => d.toJSON());

        expect(actualRawSVDocuments).to.deep.equal(expectedRawSVDocuments);
      });
    });

    describe('orderBy', () => {
      it('should sort SVDocuments in descending order', async () => {
        svDocuments.forEach((d, i) => d.getDocument().set('age', i + 1));

        await Promise.all(
          svDocuments.map(o => svDocumentRepository.store(o)),
        );

        const query = {
          orderBy: [
            ['age', 'desc'],
          ],
        };

        const result = await svDocumentRepository.fetch(query);

        expect(result).to.be.an('array');

        const actualRawSVDocuments = result.map(d => d.toJSON());
        const expectedRawSVDocuments = svDocuments.reverse().map(d => d.toJSON());

        expect(actualRawSVDocuments).to.deep.equal(expectedRawSVDocuments);
      });

      it('should sort SVDocuments in ascending order', async () => {
        svDocuments.reverse().forEach((d, i) => d.getDocument().set('age', i + 1));

        await Promise.all(
          svDocuments.map(o => svDocumentRepository.store(o)),
        );

        const query = {
          orderBy: [
            ['age', 'asc'],
          ],
        };

        const result = await svDocumentRepository.fetch(query);

        expect(result).to.be.an('array');

        const actualRawSVDocuments = result.map(d => d.toJSON());
        const expectedRawSVDocuments = svDocuments.map(d => d.toJSON());

        expect(actualRawSVDocuments).to.deep.equal(expectedRawSVDocuments);
      });

      it('should sort SVDocuments using two fields');

      it('should sort SVDocuments by $id');

      it('should sort SVDocuments by $userId');
    });
  });

  describe('#findAllBySTHash', () => {
    it('should find all SVDocuments by stHash', async () => {
      const stHash = svDocument.getReference().getSTHash();

      const result = await svDocumentRepository.findAllBySTHash(stHash);

      expect(result).to.be.an('array');

      const [expectedSVDocument] = result;

      expect(expectedSVDocument.toJSON()).to.deep.equal(svDocument.toJSON());
    });
  });

  describe('#delete', () => {
    it('should delete SVDocument', async () => {
      await svDocumentRepository.delete(svDocument);

      const result = await svDocumentRepository.find(svDocument.getDocument().getId());

      expect(result).to.be.null();
    });
  });

  describe('#find', () => {
    it('should find SVDocument by ID');

    it('should find SVDocument marked as deleted by ID');

    it('should return null if SVDocument was not found', async () => {
      const document = await svDocumentRepository.find('unknown');

      expect(document).to.be.null();
    });
  });
});
