const validateIndexedFields = require('../../../../../lib/stateView/document/query/validateIndexedFields.js');

describe('validateIndexedFields', () => {
  let indexedFields;

  beforeEach(() => {
    indexedFields = ['$userId', 'firstName', 'lastName', '$id'];
  });

  it('should pass system $id field', () => {
    const condition = [['$id', '==', 123]];
    const result = validateIndexedFields(indexedFields, condition);

    expect(result).to.be.an('array');
    expect(result).to.be.empty();
  });

  it('should pass', () => {
    const condition = [['firstName', '==', 'name']];
    const result = validateIndexedFields(indexedFields, condition);

    expect(result).to.be.an('array');
    expect(result).to.be.empty();
  });

  it('should return an error for one field', () => {
    const condition = [['secondName', '==', 'name']];
    const result = validateIndexedFields(indexedFields, condition);

    expect(result).to.be.an('array');
    expect(result).to.have.lengthOf(1);
    expect(result[0]).to.equal('secondName');
  });

  it('should return an error for three fields', () => {
    const condition = [['secondName', '==', 'name'], ['city', '==', 'NY'], ['country', '==', 'USA']];
    const result = validateIndexedFields(indexedFields, condition);

    expect(result).to.be.an('array');
    expect(result).to.have.lengthOf(3);
    expect(result).to.have.deep.members(['secondName', 'city', 'country']);
  });

  it('should check empty condition', () => {
    const condition = [];
    const result = validateIndexedFields(indexedFields, condition);

    expect(result).to.be.an('array');
    expect(result).to.be.empty();
  });

  it('should check empty document indices', () => {
    delete indexedFields.indices;
    const condition = [['secondName', '==', 'name']];

    const result = validateIndexedFields(indexedFields, condition);

    expect(result).to.be.an('array');
    expect(result).to.have.lengthOf(1);
    expect(result[0]).to.equal('secondName');
  });
});
