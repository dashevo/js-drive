const validateIndexedFields = require('../../../../../lib/stateView/document/query/validateIndexedFields.js');
const ValidationResult = require('../../../../../lib/stateView/document/query/ValidationResult');
const NotIndexedFieldError = require('../../../../../lib/stateView/document/query/errors/NotIndexedFieldError');

describe('validateIndexedFields', () => {
  let indexedFields;

  beforeEach(() => {
    indexedFields = ['$userId', 'firstName', 'lastName', '$id'];
  });

  it('should pass system $id field', () => {
    const query = { where: [['$id', '==', 123]] };
    const result = validateIndexedFields(indexedFields, query);

    expect(result).to.be.an.instanceOf(ValidationResult);
    expect(result.isValid()).to.be.true();
    expect(result.getErrors()).to.be.an('array');
    expect(result.getErrors()).to.have.lengthOf(0);
  });

  it('should pass', () => {
    const query = { where: [['firstName', '==', 'name']] };
    const result = validateIndexedFields(indexedFields, query);

    expect(result).to.be.an.instanceOf(ValidationResult);
    expect(result.isValid()).to.be.true();
    expect(result.getErrors()).to.be.an('array');
    expect(result.getErrors()).to.have.lengthOf(0);
  });

  it('should return an error', () => {
    const query = { where: [['secondName', '==', 'name']] };
    const result = validateIndexedFields(indexedFields, query);

    expect(result).to.be.an.instanceOf(ValidationResult);
    expect(result.isValid()).to.be.false();
    expect(result.getErrors()).to.be.an('array');
    expect(result.getErrors()).to.have.lengthOf(1);
    expect(result.getErrors()[0]).to.be.an.instanceOf(NotIndexedFieldError);
    expect(result.getErrors()[0].message).to.be.equal('Search fields can only contain one of these fields: $userId, firstName, lastName, $id');
  });

  it('should check empty query', () => {
    const query = {};
    const result = validateIndexedFields(indexedFields, query);

    expect(result).to.be.an.instanceOf(ValidationResult);
    expect(result.isValid()).to.be.true();
    expect(result.getErrors()).to.be.an('array');
    expect(result.getErrors()).to.have.lengthOf(0);
  });

  it('should check empty document indices', () => {
    delete indexedFields.indices;
    const query = { where: [['secondName', '==', 'name']] };

    const result = validateIndexedFields(indexedFields, query);

    expect(result).to.be.an.instanceOf(ValidationResult);
    expect(result.isValid()).to.be.false();
    expect(result.getErrors()).to.be.an('array');
    expect(result.getErrors()).to.have.lengthOf(1);
    expect(result.getErrors()[0]).to.be.an.instanceOf(NotIndexedFieldError);
    expect(result.getErrors()[0].message).to.be.equal('Search fields can only contain one of these fields: $userId, firstName, lastName, $id');
  });
});
