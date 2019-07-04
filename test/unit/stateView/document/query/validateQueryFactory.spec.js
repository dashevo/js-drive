const validateQueryFactory = require('../../../../../lib/stateView/document/query/validateQueryFactory');
const ValidationResult = require('../../../../../lib/stateView/document/query/ValidationResult');

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

  const notObjectTestCases = [{
    type: 'number',
    value: 1,
  }, {
    type: 'boolean',
    value: true,
  }, {
    type: 'string',
    value: 'test',
  }, {
    type: 'null',
    value: null,
  }, {
    type: 'undefined',
    value: undefined,
  }, {
    type: 'function',
    value: () => {},
  }];
  notObjectTestCases.forEach((testCase) => {
    const { type, value } = testCase;
    it(`should return invalid result if query is a ${type}`, () => {
      const result = validateQuery(value);

      expect(result).to.be.instanceOf(ValidationResult);
      expect(result.isValid()).to.be.false();
    });
  });
  it('should return valid result when some valid sample query is passed', () => {

  });

  describe('where', () => {
    it('should return invalid result if "where" is not an array');
    it('should return invalid result if "where" is an empty array');
    it('should return invalid result if "where" contains more than 10 conditions');
    it('should return invalid result if "where" contains conflicting conditions');

    describe('condition', () => {
      it('should return valid result if condition contains "$id" field');
      it('should return valid result if condition contains "$userId" field');
      it('should return valid result if condition contains top-level field');
      it('should return valid result if condition contains nested path field');
      it('should return invalid result if condition contains wrong field format');
      it('should return invalid result if condition array has less than 3 elements (field, operator, value)');
      it('should return invalid result if condition array has more than 3 elements (field, operator, value)');

      describe('comparisons', () => {
        it('should return valid result if "<" operator used with a numeric value');
        it('should return valid result if "<" operator used with a string value');
        it('should return invalid result if "<" operator used with a string value longer than 512 chars');
        it('should return valid result if "<" operator used with a boolean value');
        it('should return invalid result if "<" operator used with a not scalar value');
        it('should return valid result if "<=" operator used with scalar value');
        it('should return valid result if "==" operator used with scalar value');
        it('should return valid result if ">=" operator used with scalar value');
        it('should return valid result if ">" operator used with scalar value');
      });

      describe('in', () => {
        it('should return valid result if "in" operator used with an array value');
        it('should return invalid result if "in" operator used with not an array value');
        it('should return invalid result if "in" operator used with an empty array value');
        it('should return invalid result if "in" operator used with an array value which contains more than 100'
          + ' elements');
        it('should return invalid result if "in" operator used with an array which contains not unique elements');
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
