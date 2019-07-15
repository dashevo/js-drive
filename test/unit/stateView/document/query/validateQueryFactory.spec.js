const validateQueryFactory = require('../../../../../lib/stateView/document/query/validateQueryFactory');
const ValidationResult = require('../../../../../lib/stateView/document/query/ValidationResult');
const ConflictingConditionsError = require('../../../../../lib/stateView/document/query/errors/ConflictingConditionsError');

const typesTestCases = {
  number: {
    type: 'number',
    value: 1,
  },
  boolean: {
    type: 'boolean',
    value: true,
  },
  string: {
    type: 'string',
    value: 'test',
  },
  null: {
    type: 'null',
    value: null,
  },
  undefined: {
    type: 'undefined',
    value: undefined,
  },
  function: {
    type: 'function',
    value: () => {},
  },
  object: {
    type: 'object',
    value: {},
  },
};

const notObjectTestCases = [
  typesTestCases.number,
  typesTestCases.boolean,
  typesTestCases.string,
  typesTestCases.null,
  typesTestCases.undefined,
  typesTestCases.function,
];

const notArrayTestCases = [
  typesTestCases.number,
  typesTestCases.boolean,
  typesTestCases.string,
  typesTestCases.null,
  typesTestCases.object,
  typesTestCases.function,
];

const nonScalarTestCases = [
  typesTestCases.null,
  typesTestCases.undefined,
  typesTestCases.function,
  typesTestCases.object,
];

const scalarTestCases = [
  typesTestCases.number,
  typesTestCases.string,
  typesTestCases.boolean,
];

describe('validateQueryFactory', () => {
  let findConflictingConditionsStub;
  let validateQuery;

  beforeEach(function beforeEach() {
    findConflictingConditionsStub = this.sinon.stub();

    validateQuery = validateQueryFactory(findConflictingConditionsStub);
  });

  it('should return valid result if empty query is specified', () => {
    const result = validateQuery({});

    expect(result).to.be.instanceOf(ValidationResult);
    expect(result.isValid()).to.be.true();
  });

  notObjectTestCases.forEach((testCase) => {
    const { type, value } = testCase;
    it(`should return invalid result if query is a ${type}`, () => {
      const result = validateQuery(value);

      expect(result).to.be.instanceOf(ValidationResult);
      expect(result.isValid()).to.be.false();
    });
  });
  it('should return valid result when some valid sample query is passed', () => {
    findConflictingConditionsStub.returns([]);

    const result = validateQuery({ where: [['a', '>', 1]] });

    expect(result).to.be.instanceOf(ValidationResult);
    expect(result.isValid()).to.be.true();
  });

  describe('where', () => {
    notArrayTestCases.forEach((testCase) => {
      const { type, value } = testCase;
      it(`should return invalid result if "where" is not an array, but ${type}`, () => {
        const result = validateQuery({ where: value });

        expect(result).to.be.instanceOf(ValidationResult);
        expect(result.isValid()).to.be.false();
      });
    });

    it('should return invalid result if "where" is an empty array', () => {
      const result = validateQuery({ where: [] });

      expect(result).to.be.instanceOf(ValidationResult);
      expect(result.isValid()).to.be.false();
    });
    it('should return invalid result if "where" contains more than 10 conditions', () => {
      findConflictingConditionsStub.returns([]);

      const result = validateQuery({
        where: [
          ['a', '<', 1],
          ['a', '<', 1],
          ['a', '<', 1],
          ['a', '<', 1],
          ['a', '<', 1],
          ['a', '<', 1],
          ['a', '<', 1],
          ['a', '<', 1],
          ['a', '<', 1],
          ['a', '<', 1],
          ['a', '<', 1],
        ],
      });

      expect(result).to.be.instanceOf(ValidationResult);
      expect(result.isValid()).to.be.false();
    });
    it('should return invalid result if "where" contains conflicting conditions', () => {
      findConflictingConditionsStub.returns([['a', ['<', '>']]]);

      const result = validateQuery({
        where: [
          ['a', '<', 1],
          ['a', '>', 1],
        ],
      });

      expect(result).to.be.instanceOf(ValidationResult);
      expect(result.isValid()).to.be.false();
      expect(result.errors[0]).to.be.an.instanceOf(ConflictingConditionsError);
      expect(result.errors[0].message).to.be.equal('Using multiple conditions (<, >) with a single field ("a") is not allowed');
    });

    describe('condition', () => {
      it('should return valid result if condition contains "$id" field', () => {
        findConflictingConditionsStub.returns([]);

        const result = validateQuery({ where: [['$id', '==', 'idvalue']] });

        expect(result).to.be.instanceOf(ValidationResult);
        expect(result.isValid()).to.be.true();
      });
      it('should return valid result if condition contains "$userId" field', () => {
        findConflictingConditionsStub.returns([]);

        const result = validateQuery({ where: [['$userId', '==', 'userid']] });

        expect(result).to.be.instanceOf(ValidationResult);
        expect(result.isValid()).to.be.true();
      });
      it('should return valid result if condition contains top-level field', () => {
        findConflictingConditionsStub.returns([]);

        const result = validateQuery({ where: [['a', '==', '1']] });

        expect(result).to.be.instanceOf(ValidationResult);
        expect(result.isValid()).to.be.true();
      });
      it('should return valid result if condition contains nested path field', () => {
        findConflictingConditionsStub.returns([]);

        const result = validateQuery({ where: [['a.b', '==', '1']] });

        expect(result).to.be.instanceOf(ValidationResult);
        expect(result.isValid()).to.be.true();
      });
      it('should return invalid result if field name contains restricted symbols', () => {
        findConflictingConditionsStub.returns([]);

        const result = validateQuery({ where: [['$a', '==', '1']] });

        expect(result).to.be.instanceOf(ValidationResult);
        expect(result.isValid()).to.be.false();
      });
      it('should return invalid result if condition contains invalid condition operator', () => {
        findConflictingConditionsStub.returns([]);
        const operators = ['<', '<=', '==', '>', '>='];

        operators.forEach((opertaor) => {
          const result = validateQuery({ where: [['a', opertaor, '1']] });

          expect(result).to.be.instanceOf(ValidationResult);
          // TODO: is that a valid name?
          expect(result.isValid()).to.be.true();
        });
        const result = validateQuery({ where: [['a', '===', '1']] });

        expect(result).to.be.instanceOf(ValidationResult);
        // TODO: is that a valid name?
        expect(result.isValid()).to.be.false();
      });
      it('should return invalid result if field name is more than 255 characters long', () => {
        findConflictingConditionsStub.returns([]);
        const fieldName = 'a'.repeat(255);

        let result = validateQuery({ where: [[fieldName, '==', '1']] });

        expect(result).to.be.instanceOf(ValidationResult);
        expect(result.isValid()).to.be.true();

        const longFieldName = 'a'.repeat(256);

        result = validateQuery({ where: [[longFieldName, '==', '1']] });

        expect(result).to.be.instanceOf(ValidationResult);
        expect(result.isValid()).to.be.false();
      });
      it('should return invalid result if condition array has less than 3 elements (field, operator, value)', () => {
        findConflictingConditionsStub.returns([]);

        const result = validateQuery({ where: [['a', '==']] });

        expect(result).to.be.instanceOf(ValidationResult);
        expect(result.isValid()).to.be.false();
      });
      it('should return invalid result if condition array has more than 3 elements (field, operator, value)', () => {
        findConflictingConditionsStub.returns([]);

        const result = validateQuery({ where: [['a', '==', '1', '2']] });

        expect(result).to.be.instanceOf(ValidationResult);
        expect(result.isValid()).to.be.false();
      });

      describe('comparisons', () => {
        it('should return valid result if "<" operator used with a numeric value', () => {
          findConflictingConditionsStub.returns([]);

          const result = validateQuery({ where: [['a', '<', 1]] });

          expect(result).to.be.instanceOf(ValidationResult);
          expect(result.isValid()).to.be.true();
        });
        it('should return valid result if "<" operator used with a string value', () => {
          findConflictingConditionsStub.returns([]);

          const result = validateQuery({ where: [['a', '<', 'test']] });

          expect(result).to.be.instanceOf(ValidationResult);
          expect(result.isValid()).to.be.true();
        });
        it('should return invalid result if "<" operator used with a string value longer than 512 chars', () => {
          findConflictingConditionsStub.returns([]);

          const longString = 't'.repeat(512);

          let result = validateQuery({ where: [['a', '<', longString]] });

          expect(result).to.be.instanceOf(ValidationResult);
          expect(result.isValid()).to.be.true();

          const veryLongString = 't'.repeat(513);

          result = validateQuery({ where: [['a', '<', veryLongString]] });

          expect(result).to.be.instanceOf(ValidationResult);
          expect(result.isValid()).to.be.false();
        });
        it('should return valid result if "<" operator used with a boolean value', () => {
          findConflictingConditionsStub.returns([]);

          const result = validateQuery({ where: [['a', '<', true]] });

          expect(result).to.be.instanceOf(ValidationResult);
          expect(result.isValid()).to.be.true();
        });
        nonScalarTestCases.forEach((testCase) => {
          const { type, value } = testCase;
          it(`should return invalid result if "<" operator used with a not scalar value, but ${type}`, () => {
            findConflictingConditionsStub.returns([]);

            const result = validateQuery({ where: [['a', '<', value]] });

            expect(result).to.be.instanceOf(ValidationResult);
            expect(result.isValid()).to.be.false();
          });
        });
        scalarTestCases.forEach((testCase) => {
          const { type, value } = testCase;
          it(`should return valid result if "<" operator used with a scalar value ${type}`, () => {
            findConflictingConditionsStub.returns([]);

            const result = validateQuery({ where: [['a', '<', value]] });

            expect(result).to.be.instanceOf(ValidationResult);
            expect(result.isValid()).to.be.true();
          });
        });
        scalarTestCases.forEach((testCase) => {
          const { type, value } = testCase;
          it(`should return valid result if "<=" operator used with a scalar value ${type}`, () => {
            findConflictingConditionsStub.returns([]);

            const result = validateQuery({ where: [['a', '<=', value]] });

            expect(result).to.be.instanceOf(ValidationResult);
            expect(result.isValid()).to.be.true();
          });
        });
        scalarTestCases.forEach((testCase) => {
          const { type, value } = testCase;
          it(`should return valid result if "==" operator used with a scalar value ${type}`, () => {
            findConflictingConditionsStub.returns([]);

            const result = validateQuery({ where: [['a', '==', value]] });

            expect(result).to.be.instanceOf(ValidationResult);
            expect(result.isValid()).to.be.true();
          });
        });
        scalarTestCases.forEach((testCase) => {
          const { type, value } = testCase;
          it(`should return valid result if ">=" operator used with a scalar value ${type}`, () => {
            findConflictingConditionsStub.returns([]);

            const result = validateQuery({ where: [['a', '<=', value]] });

            expect(result).to.be.instanceOf(ValidationResult);
            expect(result.isValid()).to.be.true();
          });
        });
        scalarTestCases.forEach((testCase) => {
          const { type, value } = testCase;
          it(`should return valid result if ">=" operator used with a scalar value ${type}`, () => {
            findConflictingConditionsStub.returns([]);

            const result = validateQuery({ where: [['a', '>', value]] });

            expect(result).to.be.instanceOf(ValidationResult);
            expect(result.isValid()).to.be.true();
          });
        });
      });

      describe('in', () => {
        it('should return valid result if "in" operator used with an array value', () => {
          findConflictingConditionsStub.returns([]);
          const result = validateQuery({ where: [['a', 'in', [1, 2]]] });

          expect(result).to.be.instanceOf(ValidationResult);
          expect(result.isValid()).to.be.true();
        });
        notArrayTestCases.forEach(({ type, value }) => {
          it(`should return invalid result if "in" operator used with not an array value, but ${type}`, () => {
            findConflictingConditionsStub.returns([]);
            const result = validateQuery({ where: [['a', 'in', value]] });

            expect(result).to.be.instanceOf(ValidationResult);
            expect(result.isValid()).to.be.false();
          });
        });
        it('should return invalid result if "in" operator used with an empty array value', () => {
          findConflictingConditionsStub.returns([]);
          const result = validateQuery({ where: [['a', 'in', []]] });

          expect(result).to.be.instanceOf(ValidationResult);
          expect(result.isValid()).to.be.false();
        });
        it('should return invalid result if "in" operator used with an array value which contains more than 100'
          + ' elements', () => {
          findConflictingConditionsStub.returns([]);
          const value = [];
          for (let i = 0; i < 100; i++) {
            value.push(i);
          }
          let result = validateQuery({ where: [['a', 'in', value]] });

          expect(result).to.be.instanceOf(ValidationResult);
          expect(result.isValid()).to.be.true();

          value.push(101);
          result = validateQuery({ where: [['a', 'in', value]] });

          expect(result).to.be.instanceOf(ValidationResult);
          expect(result.isValid()).to.be.false();
        });
        it('should return invalid result if "in" operator used with an array which contains not unique elements', () => {
          findConflictingConditionsStub.returns([]);
          const value = [1, 1];
          const result = validateQuery({ where: [['a', 'in', value]] });

          expect(result).to.be.instanceOf(ValidationResult);
          expect(result.isValid()).to.be.false();
        });
        it('What are allowed value in the array? can it be other array?', () => {
          throw new Error('Not implemented');
        });
      });

      describe('startsWith', () => {
        it('should return valid result if "startsWith" operator used with a string value');
        it('should return invalid result if "startsWith" operator used with an empty string value');
        it('should return invalid result if "startsWith" operator used with a string value which is more than 255'
          + ' chars long');
        it('should return invalid result if "startWith" operator used with a not string value');
      });

      describe('elementMatch', () => {
        it('should return valid result if "elementMatch" operator used with "where" conditions');
        it('should return invalid result if "elementMatch" operator used with invalid "where" conditions');
        it('should return invalid result if "elementMatch" operator used with less than 2 "where" conditions');
        it('should return invalid result if value contains conflicting conditions');
        it('should return invalid result if $id field is specified');
        it('should return invalid result if $userId field is specified');
        it('should return invalid result if value contains nested "elementMatch" operator');
      });

      describe('length', () => {
        it('should return valid result if "length" operator used with a numeric value');
        it('should return invalid result if "length" operator used with a float numeric value');
        it('should return invalid result if "length" operator used with a numeric value which is less than 0');
        it('should return invalid result if "length" operator used with a not numeric value');
      });

      describe('contains', () => {
        it('should return valid result if "contains" operator used with a scalar value');
        it('should return valid result if "contains" operator used with an array of scalar values');
        it('should return invalid result if "contains" operator used with an array which has '
          + ' more than 100 elements');
        it('should return invalid result if "contains" operator used with an empty array');
        it('should return invalid result if "contains" operator used with an array which contains not unique'
          + ' elements');
      });
    });
  });

  describe('limit', () => {
    it('should return valid result if "limit" is a number');
    it('should return invalid result if "limit" is less than 1');
    it('should return invalid result if "limit" is bigger than 100');
    it('should return invalid result if "limit" is a float number');
  });

  describe('orderBy', () => {
    it('should return valid result if "orderBy" contains 1 sorting field');
    it('should return valid result if "orderBy" contains 2 sorting fields');
    it('should return invalid result if "orderBy" is an empty array');
    it('should return invalid result if "orderBy" has more than 2 sorting fields');
    it('should return invalid result if "orderBy" has wrong field format');
    it('should return invalid result if "orderBy" has wrong direction');
    it('should return invalid result if "orderBy" field array has less than 2 elements (field, direction)');
    it('should return invalid result if "orderBy" field array has more than 2 elements (field, direction)');
    it('should return invalid result if "orderBy" contains duplicate sorting fields');
  });

  describe('startAt', () => {
    it('should return valid result if "startAt" is a number', () => {
      const result = validateQuery({
        startAfter: 1,
      });

      expect(result).to.be.instanceOf(ValidationResult);
      expect(result.isValid()).to.be.true();
    });

    it('should return invalid result if "startAt" is not a number');
    it('should return invalid result if "startAt" less than 1');
    it('should return invalid result if "startAt" more than 20000');
  });

  describe('startAfter', () => {
    it('should return invalid result if both "startAt" and "startAfter" are present', () => {
      const result = validateQuery({
        startAfter: 1,
        startAt: 1,
      });

      expect(result).to.be.instanceOf(ValidationResult);
      expect(result.isValid()).to.be.false();
      expect(result.getErrors()).to.have.lengthOf(4);

      const [notError1, notError2, notError3, anyOfError] = result.getErrors();

      expect(notError1.schemaPath).to.equal('#/anyOf/0/not');
      expect(notError2.schemaPath).to.equal('#/anyOf/1/not');
      expect(notError3.schemaPath).to.equal('#/anyOf/2/not');
      expect(anyOfError.schemaPath).to.equal('#/anyOf');
    });

    it('should return valid result if "startAfter" is a number', () => {
      const result = validateQuery({
        startAfter: 1,
      });

      expect(result).to.be.instanceOf(ValidationResult);
      expect(result.isValid()).to.be.true();
    });

    it('should return invalid result if "startAfter" is not a number');
    it('should return invalid result if "startAfter" less than 1');
    it('should return invalid result if "startAfter" more than 20000');
  });
});
