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

const nonStringTestCases = [
  typesTestCases.number,
  typesTestCases.boolean,
  typesTestCases.null,
  typesTestCases.undefined,
  typesTestCases.object,
  typesTestCases.function,
];

const nonNumberTestCases = [
  typesTestCases.string,
  typesTestCases.boolean,
  typesTestCases.null,
  typesTestCases.undefined,
  typesTestCases.object,
  typesTestCases.function,
];

const nonNumberAndUndefinedTestCases = [
  typesTestCases.string,
  typesTestCases.boolean,
  typesTestCases.null,
  typesTestCases.object,
  typesTestCases.function,
];

const validFieldNameTestCases = [
  'a',
  'a.b',
  'a.b.c',
  'array.element',
  'a.0',
  'a.0.b',
  'a_._b',
  'a-b.c_',
];

const invalidFieldNameTestCases = [
  '$a',
  '$#1321',
  'a...',
  '.a',
  'a.b.c.',
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

  notObjectTestCases.forEach(({ type, value }) => {
    it(`should return invalid result if query is a ${type}`, () => {
      const result = validateQuery(value);

      expect(result).to.be.instanceOf(ValidationResult);
      expect(result.isValid()).to.be.false();
      expect(result.errors[0].keyword).to.be.equal('type');
      expect(result.errors[0].message).to.be.equal('should be object');
    });
  });

  it('should return valid result when some valid sample query is passed', () => {
    findConflictingConditionsStub.returns([]);

    const result = validateQuery({ where: [['a', '>', 1]] });

    expect(result).to.be.instanceOf(ValidationResult);
    expect(result.isValid()).to.be.true();
  });

  describe('where', () => {
    notArrayTestCases.forEach(({ type, value }) => {
      it(`should return invalid result if "where" is not an array, but ${type}`, () => {
        const result = validateQuery({ where: value });

        expect(result).to.be.instanceOf(ValidationResult);
        expect(result.isValid()).to.be.false();
        expect(result.errors[0].dataPath).to.be.equal('.where');
        expect(result.errors[0].keyword).to.be.equal('type');
        expect(result.errors[0].message).to.be.equal('should be array');
      });
    });

    it('should return invalid result if "where" is an empty array', () => {
      const result = validateQuery({ where: [] });

      expect(result).to.be.instanceOf(ValidationResult);
      expect(result.isValid()).to.be.false();
      expect(result.errors[0].dataPath).to.be.equal('.where');
      expect(result.errors[0].keyword).to.be.equal('minItems');
      expect(result.errors[0].message).to.be.equal('should NOT have fewer than 1 items');
    });

    it('should return invalid result if "where" contains more than 10 conditions', () => {
      findConflictingConditionsStub.returns([]);

      const where = Array(11).fill(['a', '<', 1]);

      const result = validateQuery({ where });

      expect(result).to.be.instanceOf(ValidationResult);
      expect(result.isValid()).to.be.false();
      expect(result.errors[0].dataPath).to.be.equal('.where');
      expect(result.errors[0].keyword).to.be.equal('maxItems');
      expect(result.errors[0].message).to.be.equal('should NOT have more than 10 items');
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
      expect(result.errors[0].getField()).to.be.equal('a');
      expect(result.errors[0].getOperators()).to.be.deep.equal(['<', '>']);
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

      invalidFieldNameTestCases.forEach((fieldName) => {
        it(`should return invalid result if field name contains restricted symbols: ${fieldName}`, () => {
          findConflictingConditionsStub.returns([]);

          const result = validateQuery({ where: [['$a', '==', '1']] });

          expect(result).to.be.instanceOf(ValidationResult);
          expect(result.isValid()).to.be.false();
          expect(result.errors[0].dataPath).to.be.equal('.where[0][0]');
          expect(result.errors[0].keyword).to.be.equal('pattern');
          expect(result.errors[0].message).to.be.equal(
            'should match pattern "^(\\$id|\\$userId|[a-zA-Z0-9-_]|[a-zA-Z0-9-_]+(.[a-zA-Z0-9-_]+)+?)$"',
          );
        });
      });

      it('should return invalid result if condition contains invalid condition operator', () => {
        findConflictingConditionsStub.returns([]);
        const operators = ['<', '<=', '==', '>', '>='];

        operators.forEach((operator) => {
          const result = validateQuery({ where: [['a', operator, '1']] });

          expect(result).to.be.instanceOf(ValidationResult);
          expect(result.isValid()).to.be.true();
        });
        const result = validateQuery({ where: [['a', '===', '1']] });

        expect(result).to.be.instanceOf(ValidationResult);
        expect(result.isValid()).to.be.false();

        expect(result.errors[6].dataPath).to.be.equal('.where[0]');
        expect(result.errors[6].keyword).to.be.equal('oneOf');
        expect(result.errors[6].message).to.be.equal('should match exactly one schema in oneOf');
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

        expect(result.errors[0].dataPath).to.be.equal('.where[0][0]');
        expect(result.errors[0].keyword).to.be.equal('maxLength');
        expect(result.errors[0].message).to.be.equal('should NOT be longer than 255 characters');
      });

      it('should return invalid result if condition array has less than 3 elements (field, operator, value)', () => {
        findConflictingConditionsStub.returns([]);

        const result = validateQuery({ where: [['a', '==']] });

        expect(result).to.be.instanceOf(ValidationResult);
        expect(result.isValid()).to.be.false();

        expect(result.errors[0].dataPath).to.be.equal('.where[0]');
        expect(result.errors[0].keyword).to.be.equal('minItems');
        expect(result.errors[0].message).to.be.equal('should NOT have fewer than 3 items');
      });

      it('should return invalid result if condition array has more than 3 elements (field, operator, value)', () => {
        findConflictingConditionsStub.returns([]);

        const result = validateQuery({ where: [['a', '==', '1', '2']] });

        expect(result).to.be.instanceOf(ValidationResult);
        expect(result.isValid()).to.be.false();
        expect(result.errors[0].dataPath).to.be.equal('.where[0]');
        expect(result.errors[0].keyword).to.be.equal('maxItems');
        expect(result.errors[0].message).to.be.equal('should NOT have more than 3 items');
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
          expect(result.errors[0].dataPath).to.be.equal('.where[0][2]');
          expect(result.errors[0].keyword).to.be.equal('maxLength');
          expect(result.errors[0].message).to.be.equal('should NOT be longer than 512 characters');
        });

        it('should return valid result if "<" operator used with a boolean value', () => {
          findConflictingConditionsStub.returns([]);

          const result = validateQuery({ where: [['a', '<', true]] });

          expect(result).to.be.instanceOf(ValidationResult);
          expect(result.isValid()).to.be.true();
        });

        nonScalarTestCases.forEach(({ type, value }) => {
          it(`should return invalid result if "<" operator used with a not scalar value, but ${type}`, () => {
            findConflictingConditionsStub.returns([]);

            const result = validateQuery({ where: [['a', '<', value]] });

            expect(result).to.be.instanceOf(ValidationResult);
            expect(result.isValid()).to.be.false();
            expect(result.errors[0].dataPath).to.be.equal('.where[0][2]');
            expect(result.errors[0].keyword).to.be.equal('type');
            expect(result.errors[0].message).to.be.equal('should be string');
            expect(result.errors[1].dataPath).to.be.equal('.where[0][2]');
            expect(result.errors[1].keyword).to.be.equal('type');
            expect(result.errors[1].message).to.be.equal('should be number');
            expect(result.errors[2].dataPath).to.be.equal('.where[0][2]');
            expect(result.errors[2].keyword).to.be.equal('type');
            expect(result.errors[2].message).to.be.equal('should be boolean');
          });
        });

        scalarTestCases.forEach(({ type, value }) => {
          it(`should return valid result if "<" operator used with a scalar value ${type}`, () => {
            findConflictingConditionsStub.returns([]);

            const result = validateQuery({ where: [['a', '<', value]] });

            expect(result).to.be.instanceOf(ValidationResult);
            expect(result.isValid()).to.be.true();
          });
        });

        scalarTestCases.forEach(({ type, value }) => {
          it(`should return valid result if "<=" operator used with a scalar value ${type}`, () => {
            findConflictingConditionsStub.returns([]);

            const result = validateQuery({ where: [['a', '<=', value]] });

            expect(result).to.be.instanceOf(ValidationResult);
            expect(result.isValid()).to.be.true();
          });
        });

        scalarTestCases.forEach(({ type, value }) => {
          it(`should return valid result if "==" operator used with a scalar value ${type}`, () => {
            findConflictingConditionsStub.returns([]);

            const result = validateQuery({ where: [['a', '==', value]] });

            expect(result).to.be.instanceOf(ValidationResult);
            expect(result.isValid()).to.be.true();
          });
        });

        scalarTestCases.forEach(({ type, value }) => {
          it(`should return valid result if ">=" operator used with a scalar value ${type}`, () => {
            findConflictingConditionsStub.returns([]);

            const result = validateQuery({ where: [['a', '<=', value]] });

            expect(result).to.be.instanceOf(ValidationResult);
            expect(result.isValid()).to.be.true();
          });
        });

        scalarTestCases.forEach(({ type, value }) => {
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
            expect(result.errors[1].dataPath).to.be.equal('.where[0][2]');
            expect(result.errors[1].keyword).to.be.equal('type');
            expect(result.errors[1].message).to.be.equal('should be array');
          });
        });

        it('should return invalid result if "in" operator used with an empty array value', () => {
          findConflictingConditionsStub.returns([]);
          const result = validateQuery({ where: [['a', 'in', []]] });

          expect(result).to.be.instanceOf(ValidationResult);
          expect(result.isValid()).to.be.false();
          expect(result.errors[1].dataPath).to.be.equal('.where[0][2]');
          expect(result.errors[1].keyword).to.be.equal('minItems');
          expect(result.errors[1].message).to.be.equal('should NOT have fewer than 1 items');
        });

        it('should return invalid result if "in" operator used with an array value which contains more than 100'
          + ' elements', () => {
          findConflictingConditionsStub.returns([]);

          const arr = [];

          for (let i = 0; i < 100; i++) {
            arr.push(i);
          }

          let result = validateQuery({ where: [['a', 'in', arr]] });

          expect(result).to.be.instanceOf(ValidationResult);
          expect(result.isValid()).to.be.true();

          arr.push(101);

          result = validateQuery({ where: [['a', 'in', arr]] });

          expect(result).to.be.instanceOf(ValidationResult);
          expect(result.isValid()).to.be.false();
          expect(result.errors[1].dataPath).to.be.equal('.where[0][2]');
          expect(result.errors[1].keyword).to.be.equal('maxItems');
          expect(result.errors[1].message).to.be.equal('should NOT have more than 100 items');
        });

        it('should return invalid result if "in" operator used with an array which contains not unique elements', () => {
          findConflictingConditionsStub.returns([]);
          const arr = [1, 1];
          const result = validateQuery({ where: [['a', 'in', arr]] });

          expect(result).to.be.instanceOf(ValidationResult);
          expect(result.isValid()).to.be.false();
          expect(result.errors[1].dataPath).to.be.equal('.where[0][2]');
          expect(result.errors[1].keyword).to.be.equal('uniqueItems');
          expect(result.errors[1].message).to.be.equal('should NOT have duplicate items (items ## 0 and 1 are identical)');
        });

        it('should return invalid results if condition contains empty arrays', () => {
          findConflictingConditionsStub.returns([]);
          const arr = [[], []];
          const result = validateQuery({ where: [['a', 'in', arr]] });

          expect(result).to.be.instanceOf(ValidationResult);
          expect(result.isValid()).to.be.false();
        });
      });

      describe('startsWith', () => {
        it('should return valid result if "startsWith" operator used with a string value', () => {
          findConflictingConditionsStub.returns([]);
          const result = validateQuery({ where: [['a', 'startsWith', 'b']] });

          expect(result).to.be.instanceOf(ValidationResult);
          expect(result.isValid()).to.be.true();
        });

        it('should return invalid result if "startsWith" operator used with an empty string value', () => {
          findConflictingConditionsStub.returns([]);
          const result = validateQuery({ where: [['a', 'startsWith', '']] });

          expect(result).to.be.instanceOf(ValidationResult);
          expect(result.isValid()).to.be.false();
          expect(result.errors[2].dataPath).to.be.equal('.where[0][2]');
          expect(result.errors[2].keyword).to.be.equal('minLength');
          expect(result.errors[2].message).to.be.equal('should NOT be shorter than 1 characters');
        });

        it('should return invalid result if "startsWith" operator used with a string value which is more than 255'
          + ' chars long', () => {
          findConflictingConditionsStub.returns([]);

          const value = 'b'.repeat(256);
          const result = validateQuery({ where: [['a', 'startsWith', value]] });

          expect(result).to.be.instanceOf(ValidationResult);
          expect(result.isValid()).to.be.false();
          expect(result.errors[2].dataPath).to.be.equal('.where[0][2]');
          expect(result.errors[2].keyword).to.be.equal('maxLength');
          expect(result.errors[2].message).to.be.equal('should NOT be longer than 255 characters');
        });

        nonStringTestCases.forEach(({ type, value }) => {
          it(`should return invalid result if "startWith" operator used with a not string value, but ${type}`, () => {
            findConflictingConditionsStub.returns([]);

            const result = validateQuery({ where: [['a', 'startsWith', value]] });

            expect(result).to.be.instanceOf(ValidationResult);
            expect(result.isValid()).to.be.false();
            expect(result.errors[2].dataPath).to.be.equal('.where[0][2]');
            expect(result.errors[2].keyword).to.be.equal('type');
            expect(result.errors[2].message).to.be.equal('should be string');
          });
        });
      });

      describe('elementMatch', () => {
        it('should return valid result if "elementMatch" operator used with "where" conditions', () => {
          findConflictingConditionsStub.returns([]);

          const result = validateQuery({
            where: [
              ['arr', 'elementMatch',
                [['elem', '>', 1], ['elem', '<', 3]],
              ],
            ],
          });

          expect(result).to.be.instanceOf(ValidationResult);
          expect(result.isValid()).to.be.true();
        });

        it('should return invalid result if "elementMatch" operator used with invalid "where" conditions', () => {
          findConflictingConditionsStub.returns([]);

          const result = validateQuery({
            where: [
              ['arr', 'elementMatch',
                [['elem', 'startsWith', 1], ['elem', '<', 3]],
              ],
            ],
          });

          expect(result).to.be.instanceOf(ValidationResult);
          expect(result.isValid()).to.be.false();
          expect(result.errors[9].dataPath).to.be.equal('.where[0][2][0]');
          expect(result.errors[9].keyword).to.be.equal('oneOf');
          expect(result.errors[9].message).to.be.equal('should match exactly one schema in oneOf');
        });

        it('should return invalid result if "elementMatch" operator used with less than 2 "where" conditions', () => {
          findConflictingConditionsStub.returns([]);

          const result = validateQuery({
            where: [
              ['arr', 'elementMatch',
                [['elem', '>', 1]],
              ],
            ],
          });

          expect(result).to.be.instanceOf(ValidationResult);
          expect(result.isValid()).to.be.false();
          expect(result.errors[3].dataPath).to.be.equal('.where[0][2]');
          expect(result.errors[3].keyword).to.be.equal('minItems');
          expect(result.errors[3].message).to.be.equal('should NOT have fewer than 2 items');
        });

        it('should return invalid result if value contains conflicting conditions', () => {
          findConflictingConditionsStub.returns([['elem', ['>', '>']]]);

          const result = validateQuery({
            where: [
              ['arr', 'elementMatch',
                [['elem', '>', 1], ['elem', '>', 1]],
              ],
            ],
          });

          expect(result).to.be.instanceOf(ValidationResult);
          expect(result.isValid()).to.be.false();
          expect(result.errors[0].getField()).to.be.equal('elem');
          expect(result.errors[0].message).to.be.equal('Using multiple conditions (>, >) with a single field ("elem") is not allowed');
        });

        it('should return invalid result if $id field is specified', () => {
          findConflictingConditionsStub.returns([]);

          const result = validateQuery({
            where: [
              ['arr', 'elementMatch',
                [['$id', '>', 1], ['$id', '<', 3]],
              ],
            ],
          });

          expect(result).to.be.instanceOf(ValidationResult);
          expect(result.isValid()).to.be.false();
          expect(result.errors[0].getField()).to.be.equal('$id');
          expect(result.errors[0].message).to.be.equal('Field $id is not supported in nested objects');
        });

        it('should return invalid result if $userId field is specified', () => {
          findConflictingConditionsStub.returns([]);

          const result = validateQuery({
            where: [
              ['arr', 'elementMatch',
                [['$userId', '>', 1], ['$userId', '<', 3]],
              ],
            ],
          });

          expect(result).to.be.instanceOf(ValidationResult);
          expect(result.isValid()).to.be.false();
        });

        it('should return invalid result if value contains nested "elementMatch" operator', () => {
          findConflictingConditionsStub.returns([]);

          const result = validateQuery({
            where: [
              ['arr', 'elementMatch',
                [['subArr', 'elementMatch', [
                  ['subArrElem', '>', 1], ['subArrElem', '<', 3],
                ]], ['subArr', '<', 3]],
              ],
            ],
          });

          expect(result).to.be.instanceOf(ValidationResult);
          expect(result.isValid()).to.be.false();
          expect(result.errors[0].getField()).to.be.equal('subArr');
          expect(result.errors[0].message).to.be.equal('Nested "elementMatch" operator is not supported');
        });
      });

      describe('length', () => {
        it('should return valid result if "length" operator used with a positive numeric value', () => {
          findConflictingConditionsStub.returns([]);
          const result = validateQuery({
            where: [
              ['arr', 'length', 2],
            ],
          });

          expect(result).to.be.instanceOf(ValidationResult);
          expect(result.isValid()).to.be.true();
        });

        it('should return valid result if "length" operator used with zero', () => {
          findConflictingConditionsStub.returns([]);

          const result = validateQuery({
            where: [
              ['arr', 'length', 0],
            ],
          });

          expect(result).to.be.instanceOf(ValidationResult);
          expect(result.isValid()).to.be.true();
        });

        it('should return invalid result if "length" operator used with a float numeric value', () => {
          findConflictingConditionsStub.returns([]);

          const result = validateQuery({
            where: [
              ['arr', 'length', 1.2],
            ],
          });

          expect(result).to.be.instanceOf(ValidationResult);
          expect(result.isValid()).to.be.false();
          expect(result.errors[4].dataPath).to.be.equal('.where[0][2]');
          expect(result.errors[4].message).to.be.equal('should be multiple of 1');
        });

        it('should return invalid result if "length" operator used with a NaN', () => {
          findConflictingConditionsStub.returns([]);

          const result = validateQuery({
            where: [
              ['arr', 'length', NaN],
            ],
          });

          expect(result).to.be.instanceOf(ValidationResult);
          expect(result.isValid()).to.be.false();
          expect(result.errors[4].dataPath).to.be.equal('.where[0][2]');
          expect(result.errors[4].keyword).to.be.equal('minimum');
          expect(result.errors[4].message).to.be.equal('should be >= 0');
        });

        it('should return invalid result if "length" operator used with a numeric value which is less than 0', () => {
          findConflictingConditionsStub.returns([]);
          const result = validateQuery({
            where: [
              ['arr', 'length', -1],
            ],
          });

          expect(result).to.be.instanceOf(ValidationResult);
          expect(result.isValid()).to.be.false();
          expect(result.errors[4].dataPath).to.be.equal('.where[0][2]');
          expect(result.errors[4].keyword).to.be.equal('minimum');
          expect(result.errors[4].message).to.be.equal('should be >= 0');
        });
        nonNumberTestCases.forEach(({ type, value }) => {
          it(`should return invalid result if "length" operator used with a ${type} instead of numeric value`, () => {
            findConflictingConditionsStub.returns([]);
            const result = validateQuery({
              where: [
                ['arr', 'length', value],
              ],
            });

            expect(result).to.be.instanceOf(ValidationResult);
            expect(result.isValid()).to.be.false();
            expect(result.errors[4].dataPath).to.be.equal('.where[0][2]');
            expect(result.errors[4].keyword).to.be.equal('type');
            expect(result.errors[4].message).to.be.equal('should be number');
          });
        });
      });

      describe('contains', () => {
        scalarTestCases.forEach(({ type, value }) => {
          it(`should return valid result if "contains" operator used with a scalar value ${type}`, () => {
            findConflictingConditionsStub.returns([]);
            const result = validateQuery({
              where: [
                ['arr', 'contains', value],
              ],
            });

            expect(result).to.be.instanceOf(ValidationResult);
            expect(result.isValid()).to.be.true();
          });
        });

        scalarTestCases.forEach(({ type, value }) => {
          it(`should return valid result if "contains" operator used with an array of scalar values ${type}`, () => {
            findConflictingConditionsStub.returns([]);
            const result = validateQuery({
              where: [
                ['arr', 'contains', [value]],
              ],
            });

            expect(result).to.be.instanceOf(ValidationResult);
            expect(result.isValid()).to.be.true();
          });
        });

        it('should return invalid result if "contains" operator used with an array which has '
          + ' more than 100 elements', () => {
          findConflictingConditionsStub.returns([]);
          const arr = [];
          for (let i = 0; i < 100; i++) {
            arr.push(i);
          }
          let result = validateQuery({
            where: [
              ['arr', 'contains', arr],
            ],
          });

          expect(result).to.be.instanceOf(ValidationResult);
          expect(result.isValid()).to.be.true();

          arr.push(101);

          result = validateQuery({
            where: [
              ['arr', 'contains', arr],
            ],
          });

          expect(result).to.be.instanceOf(ValidationResult);
          expect(result.isValid()).to.be.false();
          expect(result.errors[9].dataPath).to.be.equal('.where[0][2]');
          expect(result.errors[9].keyword).to.be.equal('maxItems');
          expect(result.errors[9].message).to.be.equal('should NOT have more than 100 items');
        });

        it('should return invalid result if "contains" operator used with an empty array', () => {
          findConflictingConditionsStub.returns([]);
          const result = validateQuery({
            where: [
              ['arr', 'contains', []],
            ],
          });

          expect(result).to.be.instanceOf(ValidationResult);
          expect(result.isValid()).to.be.false();
          expect(result.errors[9].dataPath).to.be.equal('.where[0][2]');
          expect(result.errors[9].keyword).to.be.equal('minItems');
          expect(result.errors[9].message).to.be.equal('should NOT have fewer than 1 items');
        });

        it('should return invalid result if "contains" operator used with an array which contains not unique'
          + ' elements', () => {
          findConflictingConditionsStub.returns([]);
          const result = validateQuery({
            where: [
              ['arr', 'contains', [1, 1]],
            ],
          });

          expect(result).to.be.instanceOf(ValidationResult);
          expect(result.isValid()).to.be.false();
          expect(result.errors[9].dataPath).to.be.equal('.where[0][2]');
          expect(result.errors[9].keyword).to.be.equal('uniqueItems');
          expect(result.errors[9].message).to.be.equal('should NOT have duplicate items (items ## 0 and 1 are identical)');
        });

        nonScalarTestCases.forEach(({ type, value }) => {
          it(`should return invalid result if used with non-scalar value ${type}`, () => {
            findConflictingConditionsStub.returns([]);
            const result = validateQuery({
              where: [
                ['arr', 'contains', value],
              ],
            });

            expect(result).to.be.instanceOf(ValidationResult);
            expect(result.isValid()).to.be.false();
            expect(result.errors[5].dataPath).to.be.equal('.where[0][2]');
            expect(result.errors[5].keyword).to.be.equal('type');
            expect(result.errors[5].message).to.be.equal('should be string');
            expect(result.errors[6].dataPath).to.be.equal('.where[0][2]');
            expect(result.errors[6].keyword).to.be.equal('type');
            expect(result.errors[6].message).to.be.equal('should be number');
            expect(result.errors[7].dataPath).to.be.equal('.where[0][2]');
            expect(result.errors[7].keyword).to.be.equal('type');
            expect(result.errors[7].message).to.be.equal('should be boolean');
          });
        });

        nonScalarTestCases.forEach(({ type, value }) => {
          it(`should return invalid result if used with an array of non-scalar values ${type}`, () => {
            findConflictingConditionsStub.returns([]);
            const result = validateQuery({
              where: [
                ['arr', 'contains', [value]],
              ],
            });

            expect(result).to.be.instanceOf(ValidationResult);
            expect(result.isValid()).to.be.false();
            expect(result.errors[9].dataPath).to.be.equal('.where[0][2][0]');
            expect(result.errors[9].keyword).to.be.equal('type');
            expect(result.errors[9].message).to.be.equal('should be string');
            expect(result.errors[10].dataPath).to.be.equal('.where[0][2][0]');
            expect(result.errors[10].keyword).to.be.equal('type');
            expect(result.errors[10].message).to.be.equal('should be number');
            expect(result.errors[11].dataPath).to.be.equal('.where[0][2][0]');
            expect(result.errors[11].keyword).to.be.equal('type');
            expect(result.errors[11].message).to.be.equal('should be boolean');
          });
        });
      });
    });
  });

  describe('limit', () => {
    it('should return valid result if "limit" is a number', () => {
      findConflictingConditionsStub.returns([]);
      const result = validateQuery({
        where: [
          ['a', '>', 1],
        ],
        limit: 1,
      });

      expect(result).to.be.instanceOf(ValidationResult);
      expect(result.isValid()).to.be.true();
    });

    it('should return invalid result if "limit" is less than 1', () => {
      findConflictingConditionsStub.returns([]);
      const where = [
        ['a', '>', 1],
      ];
      let result = validateQuery({ where, limit: 0 });

      expect(result).to.be.instanceOf(ValidationResult);
      expect(result.isValid()).to.be.false();
      expect(result.errors[0].dataPath).to.be.equal('.limit');
      expect(result.errors[0].keyword).to.be.equal('minimum');
      expect(result.errors[0].message).to.be.equal('should be >= 1');

      result = validateQuery({ where, limit: -1 });

      expect(result).to.be.instanceOf(ValidationResult);
      expect(result.isValid()).to.be.false();
      expect(result.errors[0].dataPath).to.be.equal('.limit');
      expect(result.errors[0].keyword).to.be.equal('minimum');
      expect(result.errors[0].message).to.be.equal('should be >= 1');
    });

    it('should return invalid result if "limit" is bigger than 100', () => {
      findConflictingConditionsStub.returns([]);
      const where = [
        ['a', '>', 1],
      ];
      let result = validateQuery({ where, limit: 100 });

      expect(result).to.be.instanceOf(ValidationResult);
      expect(result.isValid()).to.be.true();

      result = validateQuery({ where, limit: 101 });

      expect(result).to.be.instanceOf(ValidationResult);
      expect(result.isValid()).to.be.false();
      expect(result.errors[0].dataPath).to.be.equal('.limit');
      expect(result.errors[0].keyword).to.be.equal('maximum');
      expect(result.errors[0].message).to.be.equal('should be <= 100');
    });

    it('should return invalid result if "limit" is a float number', () => {
      findConflictingConditionsStub.returns([]);

      const where = [
        ['a', '>', 1],
      ];

      const result = validateQuery({ where, limit: 1.5 });

      expect(result).to.be.instanceOf(ValidationResult);
      expect(result.isValid()).to.be.false();
      expect(result.errors[0].dataPath).to.be.equal('.limit');
      expect(result.errors[0].keyword).to.be.equal('multipleOf');
      expect(result.errors[0].message).to.be.equal('should be multiple of 1');
    });

    nonNumberAndUndefinedTestCases.forEach(({ type, value }) => {
      it(`should return invalid result if "limit" is not a number, but ${type}`, () => {
        findConflictingConditionsStub.returns([]);

        const result = validateQuery({
          where: [
            ['a', '>', 1],
          ],
          limit: value,
        });

        expect(result).to.be.instanceOf(ValidationResult);
        expect(result.isValid()).to.be.false();

        expect(result.errors[0].dataPath).to.be.equal('.limit');
        expect(result.errors[0].keyword).to.be.equal('type');
        expect(result.errors[0].message).to.be.equal('should be number');
      });
    });
  });

  describe('orderBy', () => {
    it('should return valid result if "orderBy" contains 1 sorting field', () => {
      findConflictingConditionsStub.returns([]);

      const result = validateQuery({
        where: [
          ['a', '>', 1],
        ],
        orderBy: [['a', 'asc']],
      });

      expect(result).to.be.instanceOf(ValidationResult);
      expect(result.isValid()).to.be.true();
    });

    it('should return valid result if "orderBy" contains 2 sorting fields', () => {
      findConflictingConditionsStub.returns([]);

      const result = validateQuery({
        where: [
          ['a', '>', 1],
        ],
        orderBy: [['a', 'asc'], ['b', 'desc']],
      });

      expect(result).to.be.instanceOf(ValidationResult);
      expect(result.isValid()).to.be.true();
    });

    it('should return invalid result if "orderBy" is an empty array', () => {
      findConflictingConditionsStub.returns([]);

      const result = validateQuery({
        where: [
          ['a', '>', 1],
        ],
        orderBy: [],
      });

      expect(result).to.be.instanceOf(ValidationResult);
      expect(result.isValid()).to.be.false();
      expect(result.errors[0].dataPath).to.be.equal('.orderBy');
      expect(result.errors[0].keyword).to.be.equal('minItems');
      expect(result.errors[0].message).to.be.equal('should NOT have fewer than 1 items');
    });

    it('should return invalid result if the field inside an "orderBy" is an empty array', () => {
      findConflictingConditionsStub.returns([]);

      const result = validateQuery({
        where: [
          ['a', '>', 1],
        ],
        orderBy: [[]],
      });

      expect(result).to.be.instanceOf(ValidationResult);
      expect(result.isValid()).to.be.false();
      expect(result.errors[0].dataPath).to.be.equal('.orderBy[0]');
      expect(result.errors[0].keyword).to.be.equal('minItems');
      expect(result.errors[0].message).to.be.equal('should NOT have fewer than 2 items');
    });

    it('should return invalid result if "orderBy" has more than 2 sorting fields', () => {
      findConflictingConditionsStub.returns([]);

      const result = validateQuery({
        where: [
          ['a', '>', 1],
        ],
        orderBy: [['a', 'asc'], ['b', 'desc'], ['c', 'asc']],
      });

      expect(result).to.be.instanceOf(ValidationResult);
      expect(result.isValid()).to.be.false();
      expect(result.errors[0].dataPath).to.be.equal('.orderBy');
      expect(result.errors[0].keyword).to.be.equal('maxItems');
      expect(result.errors[0].message).to.be.equal('should NOT have more than 2 items');
    });

    validFieldNameTestCases.forEach((fieldName) => {
      it(`should return true if "orderBy" has valid field format, ${fieldName}`, () => {
        findConflictingConditionsStub.returns([]);

        const result = validateQuery({
          where: [
            [fieldName, '>', 1],
          ],
          orderBy: [[fieldName, 'asc']],
        });

        expect(result).to.be.instanceOf(ValidationResult);
        expect(result.isValid()).to.be.true();
      });
    });

    invalidFieldNameTestCases.forEach((fieldName) => {
      it(`should return invalid result if "orderBy" has invalid field format, ${fieldName}`, () => {
        findConflictingConditionsStub.returns([]);

        const result = validateQuery({
          where: [
            ['a', '>', 1],
          ],
          orderBy: [['$a', 'asc']],
        });

        expect(result).to.be.instanceOf(ValidationResult);
        expect(result.isValid()).to.be.false();
        expect(result.errors[0].dataPath).to.be.equal('.orderBy[0][0]');
        expect(result.errors[0].keyword).to.be.equal('pattern');
        expect(result.errors[0].message).to.be.equal('should match pattern "^(\\$id|\\$userId|[a-zA-Z0-9-_]|[a-zA-Z0-9-_]+(.[a-zA-Z0-9-_]+)+?)$"');
      });
    });

    it('should return invalid result if "orderBy" has wrong direction', () => {
      findConflictingConditionsStub.returns([]);

      const result = validateQuery({
        where: [
          ['a', '>', 1],
        ],
        orderBy: [['a', 'a']],
      });

      expect(result).to.be.instanceOf(ValidationResult);
      expect(result.isValid()).to.be.false();
      expect(result.errors[0].dataPath).to.be.equal('.orderBy[0][1]');
      expect(result.errors[0].keyword).to.be.equal('enum');
      expect(result.errors[0].message).to.be.equal('should be equal to one of the allowed values');
    });

    it('should return invalid result if "orderBy" field array has less than 2 elements (field, direction)', () => {
      findConflictingConditionsStub.returns([]);

      const result = validateQuery({
        where: [
          ['a', '>', 1],
        ],
        orderBy: [['a']],
      });

      expect(result).to.be.instanceOf(ValidationResult);
      expect(result.isValid()).to.be.false();
      expect(result.errors[0].dataPath).to.be.equal('.orderBy[0]');
      expect(result.errors[0].keyword).to.be.equal('minItems');
      expect(result.errors[0].message).to.be.equal('should NOT have fewer than 2 items');
    });

    it('should return invalid result if "orderBy" field array has more than 2 elements (field, direction)', () => {
      findConflictingConditionsStub.returns([]);

      const result = validateQuery({
        where: [
          ['a', '>', 1],
        ],
        orderBy: [['a', 'asc', 'desc']],
      });

      expect(result).to.be.instanceOf(ValidationResult);
      expect(result.isValid()).to.be.false();
      expect(result.errors[0].dataPath).to.be.equal('.orderBy[0]');
      expect(result.errors[0].keyword).to.be.equal('maxItems');
      expect(result.errors[0].message).to.be.equal('should NOT have more than 2 items');
    });

    it('should return invalid result if "orderBy" contains duplicate sorting fields', () => {
      findConflictingConditionsStub.returns([]);

      const where = [
        ['a', '>', 1],
      ];

      let result = validateQuery({
        where,
        orderBy: [['a', 'asc'], ['a', 'asc']],
      });

      expect(result).to.be.instanceOf(ValidationResult);
      expect(result.isValid()).to.be.false();
      expect(result.errors[0].getField()).to.be.equal('a');
      expect(result.errors[0].message).to.be.equal('Duplicate sorting field a');

      result = validateQuery({
        where,
        orderBy: [['a', 'asc'], ['a', 'desc']],
      });

      expect(result).to.be.instanceOf(ValidationResult);
      expect(result.isValid()).to.be.false();
      expect(result.errors[0].getField()).to.be.equal('a');
      expect(result.errors[0].message).to.be.equal('Duplicate sorting field a');
    });
  });

  describe('startAt', () => {
    it('should return valid result if "startAt" is a number', () => {
      const result = validateQuery({
        startAt: 1,
      });

      expect(result).to.be.instanceOf(ValidationResult);
      expect(result.isValid()).to.be.true();
    });

    nonNumberAndUndefinedTestCases.forEach(({ type, value }) => {
      it(`should return invalid result if "startAt" is not a number, but ${type}`, () => {
        const result = validateQuery({
          startAt: value,
        });

        expect(result).to.be.instanceOf(ValidationResult);
        expect(result.isValid()).to.be.false();
        expect(result.errors[0].dataPath).to.be.equal('.startAt');
        expect(result.errors[0].keyword).to.be.equal('type');
        expect(result.errors[0].message).to.be.equal('should be number');
      });
    });

    it('should return invalid result if "startAt" less than 1', () => {
      const result = validateQuery({
        startAt: 0,
      });

      expect(result).to.be.instanceOf(ValidationResult);
      expect(result.isValid()).to.be.false();
      expect(result.errors[0].dataPath).to.be.equal('.startAt');
      expect(result.errors[0].keyword).to.be.equal('minimum');
      expect(result.errors[0].message).to.be.equal('should be >= 1');
    });

    it('should return invalid result if "startAt" more than 20000', () => {
      let result = validateQuery({
        startAt: 20000,
      });

      expect(result).to.be.instanceOf(ValidationResult);
      expect(result.isValid()).to.be.true();

      result = validateQuery({
        startAt: 20001,
      });

      expect(result).to.be.instanceOf(ValidationResult);
      expect(result.isValid()).to.be.false();
      expect(result.errors[0].dataPath).to.be.equal('.startAt');
      expect(result.errors[0].keyword).to.be.equal('maximum');
      expect(result.errors[0].message).to.be.equal('should be <= 20000');
    });

    it('should return invalid result if "startAt" is not an integer', () => {
      const result = validateQuery({
        startAt: 1.1,
      });

      expect(result).to.be.instanceOf(ValidationResult);
      expect(result.isValid()).to.be.false();
      expect(result.errors[0].dataPath).to.be.equal('.startAt');
      expect(result.errors[0].keyword).to.be.equal('multipleOf');
      expect(result.errors[0].message).to.be.equal('should be multiple of 1');
    });
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

    nonNumberAndUndefinedTestCases.forEach(({ type, value }) => {
      it(`should return invalid result if "startAftert" is not a number, but ${type}`, () => {
        const result = validateQuery({
          startAfter: value,
        });

        expect(result).to.be.instanceOf(ValidationResult);
        expect(result.isValid()).to.be.false();
        expect(result.errors[0].dataPath).to.be.equal('.startAfter');
        expect(result.errors[0].keyword).to.be.equal('type');
        expect(result.errors[0].message).to.be.equal('should be number');
      });
    });

    it('should return invalid result if "startAfter" less than 1', () => {
      const result = validateQuery({
        startAfter: 0,
      });

      expect(result).to.be.instanceOf(ValidationResult);
      expect(result.isValid()).to.be.false();
      expect(result.errors[0].dataPath).to.be.equal('.startAfter');
      expect(result.errors[0].keyword).to.be.equal('minimum');
      expect(result.errors[0].message).to.be.equal('should be >= 1');
    });

    it('should return invalid result if "startAfter" more than 20000', () => {
      let result = validateQuery({
        startAfter: 20000,
      });

      expect(result).to.be.instanceOf(ValidationResult);
      expect(result.isValid()).to.be.true();

      result = validateQuery({
        startAfter: 20001,
      });

      expect(result).to.be.instanceOf(ValidationResult);
      expect(result.isValid()).to.be.false();
      expect(result.errors[0].dataPath).to.be.equal('.startAfter');
      expect(result.errors[0].keyword).to.be.equal('maximum');
      expect(result.errors[0].message).to.be.equal('should be <= 20000');
    });

    it('should return invalid result if "startAfter" is not an integer', () => {
      const result = validateQuery({
        startAfter: 1.1,
      });

      expect(result).to.be.instanceOf(ValidationResult);
      expect(result.isValid()).to.be.false();
      expect(result.errors[0].dataPath).to.be.equal('.startAfter');
      expect(result.errors[0].keyword).to.be.equal('multipleOf');
      expect(result.errors[0].message).to.be.equal('should be multiple of 1');
    });
  });
});
