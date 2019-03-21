const { mocha: { startMongoDb } } = require('@dashevo/dp-services-ctl');

const SVDocument = require('../../../../lib/stateView/document/SVDocument');
const SVDocumentMongoDbRepository = require('../../../../lib/stateView/document/SVDocumentMongoDbRepository');

const sanitizer = require('../../../../lib/mongoDb/sanitizer');

const InvalidWhereError = require('../../../../lib/stateView/document/errors/InvalidWhereError');
const InvalidOrderBy = require('../../../../lib/stateView/document/errors/InvalidOrderByError');
const InvalidLimitError = require('../../../../lib/stateView/document/errors/InvalidLimitError');
const InvalidStartAtError = require('../../../../lib/stateView/document/errors/InvalidStartAtError');
const InvalidStartAfterError = require('../../../../lib/stateView/document/errors/InvalidStartAfterError');
const AmbiguousStartError = require('../../../../lib/stateView/document/errors/AmbiguousStartError');

const getSVDocumentsFixture = require('../../../../lib/test/fixtures/getSVDocumentsFixture');

function sortAndJsonizeSVDocuments(svDocuments) {
  return svDocuments.sort((prev, next) => (
    prev.getDocument().getId() > next.getDocument().getId()
  )).map(o => o.toJSON());
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

    svDocumentRepository = new SVDocumentMongoDbRepository(
      mongoDatabase,
      sanitizer,
      svDocument.getDocument().getType(),
    );

    await Promise.all(
      svDocuments.map(o => svDocumentRepository.store(o)),
    );
  });

  describe('#store', () => {
    it('should store SV Object', async () => {
      const result = await svDocumentRepository.find(svDocument.getDocument().getId());

      expect(result).to.be.an.instanceOf(SVDocument);
      expect(result.toJSON()).to.deep.equal(svDocument.toJSON());
    });
  });

  describe('#fetch', () => {
    it('should fetch SV Objects', async () => {
      const result = await svDocumentRepository.fetch();

      expect(result).to.be.an('array');

      const actualRawSVDocuments = sortAndJsonizeSVDocuments(result);
      const expectedRawSVDocuments = sortAndJsonizeSVDocuments(svDocuments);

      expect(actualRawSVDocuments).to.have.deep.members(expectedRawSVDocuments);
    });

    it('should not fetch SV Object that is marked as deleted');

    describe('where', () => {
      it('should fetch SV Objects by where condition', async () => {
        const options = {
          where: { 'document.name': svDocument.getDocument().get('name') },
        };

        const result = await svDocumentRepository.fetch(options);

        expect(result).to.be.an('array');

        const [expectedSVDocument] = result;

        expect(expectedSVDocument.toJSON()).to.deep.equal(svDocument.toJSON());
      });

      it('should throw InvalidWhereError if where clause is not an object', async () => {
        const options = {
          where: 'something',
        };

        let error;
        try {
          await svDocumentRepository.fetch(options);
        } catch (e) {
          error = e;
        }

        expect(error).to.be.an.instanceOf(InvalidWhereError);
      });

      it('should throw InvalidWhereError if where clause is boolean', async () => {
        const options = {
          where: false,
        };

        let error;
        try {
          await svDocumentRepository.fetch(options);
        } catch (e) {
          error = e;
        }

        expect(error).to.be.an.instanceOf(InvalidWhereError);
      });

      it('should return empty array if where clause conditions do not match', async () => {
        const options = {
          where: { 'document.name': 'Dash enthusiast' },
        };

        const result = await svDocumentRepository.fetch(options);

        expect(result).to.deep.equal([]);
      });

      it('should throw an unknown operator error if where clause conditions are invalid', async () => {
        const options = {
          where: { 'document.name': { $dirty: true } },
        };

        let error;
        try {
          await svDocumentRepository.fetch(options);
        } catch (e) {
          error = e;
        }

        expect(error.message).to.equal('unknown operator: $dirty');
      });

      it('should throw an unknown operator error if where clause conditions are invalid', async () => {
        const options = {
          where: { 'document.name': { $dirty: true } },
        };

        let error;
        try {
          await svDocumentRepository.fetch(options);
        } catch (e) {
          error = e;
        }

        expect(error.message).to.equal('unknown operator: $dirty');
      });
    });

    describe('limit', () => {
      it('should limit return to 1 SV Object if limit is set', async () => {
        const options = {
          limit: 1,
        };

        const result = await svDocumentRepository.fetch(options);

        expect(result).to.be.an('array');
        expect(result).to.have.lengthOf(1);
      });

      it('should throw InvalidLimitError if limit is not a number', async () => {
        const options = {
          limit: 'something',
        };

        let error;
        try {
          await svDocumentRepository.fetch(options);
        } catch (e) {
          error = e;
        }

        expect(error).to.be.an.instanceOf(InvalidLimitError);
      });

      it('should throw InvalidLimitError if limit is a boolean', async () => {
        const options = {
          limit: false,
        };

        let error;
        try {
          await svDocumentRepository.fetch(options);
        } catch (e) {
          error = e;
        }

        expect(error).to.be.an.instanceOf(InvalidLimitError);
      });
    });

    describe('orderBy', () => {
      it('should order desc', async () => {
        svDocuments.forEach((o, i) => o.getDocument().set('age', i + 1));

        await Promise.all(
          svDocuments.map(o => svDocumentRepository.store(o)),
        );

        const options = {
          orderBy: {
            'document.age': -1,
          },
        };

        const result = await svDocumentRepository.fetch(options);

        expect(result).to.be.an('array');

        const actualRawSVDocuments = result.map(o => o.toJSON());
        const expectedRawSVDocuments = svDocuments.reverse().map(o => o.toJSON());

        expect(actualRawSVDocuments).to.deep.equal(expectedRawSVDocuments);
      });

      it('should order asc', async () => {
        svDocuments.reverse().forEach((o, i) => o.getDocument().set('age', i + 1));

        await Promise.all(
          svDocuments.map(o => svDocumentRepository.store(o)),
        );

        const options = {
          orderBy: {
            'document.age': 1,
          },
        };

        const result = await svDocumentRepository.fetch(options);

        expect(result).to.be.an('array');

        const actualRawSVDocuments = result.map(o => o.toJSON());
        const expectedRawSVDocuments = svDocuments.map(o => o.toJSON());

        expect(actualRawSVDocuments).to.deep.equal(expectedRawSVDocuments);
      });

      it('should throw InvalidOrderBy if orderBy is not an object', async () => {
        const options = {
          orderBy: 'something',
        };

        let error;
        try {
          await svDocumentRepository.fetch(options);
        } catch (e) {
          error = e;
        }

        expect(error).to.be.an.instanceOf(InvalidOrderBy);
      });

      it('should throw InvalidOrderBy if orderBy is a boolean', async () => {
        const options = {
          orderBy: false,
        };

        let error;
        try {
          await svDocumentRepository.fetch(options);
        } catch (e) {
          error = e;
        }

        expect(error).to.be.an.instanceOf(InvalidOrderBy);
      });
    });

    describe('start', () => {
      it('should start at 1 object', async () => {
        svDocuments.forEach((o, i) => o.getDocument().set('age', i + 1));

        await Promise.all(
          svDocuments.map(o => svDocumentRepository.store(o)),
        );

        const options = {
          orderBy: {
            'document.age': 1,
          },
          startAt: 2,
        };

        const result = await svDocumentRepository.fetch(options);

        expect(result).to.be.an('array');

        const actualRawSVDocuments = result.map(o => o.toJSON());
        const expectedRawSVDocuments = svDocuments.splice(1).map(o => o.toJSON());

        expect(actualRawSVDocuments).to.deep.equal(expectedRawSVDocuments);
      });

      it('should throw InvalidStartAtError if startAt is not a number', async () => {
        const options = {
          startAt: 'something',
        };

        let error;
        try {
          await svDocumentRepository.fetch(options);
        } catch (e) {
          error = e;
        }

        expect(error).to.be.an.instanceOf(InvalidStartAtError);
      });

      it('should throw InvalidStartAtError if startAt is a boolean', async () => {
        const options = {
          startAt: 'something',
        };

        let error;
        try {
          await svDocumentRepository.fetch(options);
        } catch (e) {
          error = e;
        }

        expect(error).to.be.an.instanceOf(InvalidStartAtError);
      });

      it('should start after 1 object', async () => {
        svDocuments.forEach((o, i) => o.getDocument().set('age', i + 1));

        await Promise.all(
          svDocuments.map(o => svDocumentRepository.store(o)),
        );

        const options = {
          orderBy: {
            'document.age': 1,
          },
          startAfter: 1,
        };

        const result = await svDocumentRepository.fetch(options);

        expect(result).to.be.an('array');

        const actualRawSVDocuments = result.map(o => o.toJSON());
        const expectedRawSVDocuments = svDocuments.splice(1).map(o => o.toJSON());

        expect(actualRawSVDocuments).to.deep.equal(expectedRawSVDocuments);
      });

      it('should throw InvalidStartAfterError if startAfter is not a number', async () => {
        const options = {
          startAfter: 'something',
        };

        let error;
        try {
          await svDocumentRepository.fetch(options);
        } catch (e) {
          error = e;
        }

        expect(error).to.be.an.instanceOf(InvalidStartAfterError);
      });

      it('should throw InvalidStartAfterError if startAfter is a boolean', async () => {
        const options = {
          startAfter: false,
        };

        let error;
        try {
          await svDocumentRepository.fetch(options);
        } catch (e) {
          error = e;
        }

        expect(error).to.be.an.instanceOf(InvalidStartAfterError);
      });

      it('should throw AmbiguousStartError if both startAt and startAfter are present', async () => {
        let error;

        try {
          await svDocumentRepository.fetch({ startAt: 1, startAfter: 2 });
        } catch (e) {
          error = e;
        }

        expect(error).to.be.an.instanceOf(AmbiguousStartError);
      });
    });
  });

  describe('#findAllBySTHash', () => {
    it('should find all SV Objects by stHash', async () => {
      const stHash = svDocument.getReference().getSTHash();

      const result = await svDocumentRepository.findAllBySTHash(stHash);

      expect(result).to.be.an('array');

      const [expectedSVDocument] = result;

      expect(expectedSVDocument.toJSON()).to.deep.equal(svDocument.toJSON());
    });
  });

  describe('#delete', () => {
    it('should delete SV Object', async () => {
      await svDocumentRepository.delete(svDocument);

      const result = await svDocumentRepository.find(svDocument.getDocument().getId());

      expect(result).to.be.null();
    });
  });

  describe('#find', () => {
    it('should find SV Object by ID');

    it('should find SV Object marked as deleted by ID');

    it('should return null if SV object was not found', async () => {
      const object = await svDocumentRepository.find('unknown');

      expect(object).to.be.null();
    });
  });
});
