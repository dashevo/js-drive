const validateIndexedFields = require('../../../../../lib/stateView/document/query/validateIndexedFields.js');

describe('validateIndexedFields', () => {
  let indexedFields;

  beforeEach(() => {
    indexedFields = [
      [{ $userId: 'asc' }, { firstName: 'desc' }],
      [{ $userId: 'asc' }, { lastName: 'desc' }, { secondName: 'asc' }],
      [{ $id: 'asc' }],
      [{ $id: 'desc' }],
      [{ 'arrayWithObjects.item': 'desc' }],
      [{ 'arrayWithObjects.flag': 'desc' }],
    ];
  });

  it('should pass system $id field', () => {
    const condition = [['$id', '==', 123]];
    const result = validateIndexedFields(indexedFields, condition);

    expect(result).to.be.an('array');
    expect(result).to.be.empty();
  });

  it('should fail with condition by second field of compound index', () => {
    const condition = [['firstName', '==', 'name']];
    const result = validateIndexedFields(indexedFields, condition);

    expect(result).to.be.an('array');
    expect(result).to.have.lengthOf(1);
    expect(result[0]).to.equal('firstName');
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

  it('should check fields by nested conditions', () => {
    const condition = [
      ['$userId', '==', 'Cutie'],
      ['arrayWithObjects', 'elementMatch', [
        ['item', '==', 1],
        ['flag', '==', true],
      ]],
    ];

    const result = validateIndexedFields(indexedFields, condition);

    expect(result).to.be.an('array');
    expect(result).to.be.empty();
  });

  it('should fail with nested conditions', () => {
    const condition = [
      ['$userId', '==', 123],
      ['arrayWithObjects', 'elementMatch', [
        ['item', '==', 1],
        ['anotherFlag', '==', true],
      ]],
    ];

    const result = validateIndexedFields(indexedFields, condition);

    expect(result).to.be.an('array');
    expect(result).to.have.lengthOf(1);
    expect(result[0]).to.equal('arrayWithObjects.anotherFlag');
  });

  it('should pass query by compound index', () => {
    const condition = [['firstName', '==', 'name'], ['$userId', '==', 123]];
    const result = validateIndexedFields(indexedFields, condition);

    expect(result).to.be.an('array');
    expect(result).to.be.empty();
  });

  it('should fail with query by third field of compound index', () => {
    const condition = [['lastName', '==', 'name'], ['secondName', '==', 'myName']];
    const result = validateIndexedFields(indexedFields, condition);

    expect(result).to.have.lengthOf(2);
    expect(result).to.have.members(['lastName', 'secondName']);
  });
});
