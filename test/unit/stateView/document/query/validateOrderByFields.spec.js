const validateOrderByFields = require('../../../../../lib/stateView/document/query/validateOrderByFields');

describe('validateOrderByFields', () => {
  let indexedFields;

  beforeEach(() => {
    indexedFields = [
      [{ $userId: 'asc' }, { firstName: 'desc' }],
      [{ $userId: 'asc' }, { lastName: 'desc' }, { secondName: 'asc' }],
      [{ $id: 'asc' }],
      [{ $id: 'desc' }],
      [{ address: 'desc' }],
      [{ street: 'desc' }],
      [{ 'arrayWithObjects.item': 'desc' }],
      [{ 'arrayWithObjects.flag': 'desc' }],
      [{ address: 'asc' }, { 'arrayWithObjects.flag': 'desc' }],
      [{ 'arrayWithObjects.flag': 'desc' }, { street: 'asc' }],
      [{ 'arrayWithObjects.country': 'desc' }, { 'arrayWithObjects.language': 'asc' }],
    ];
  });

  it('should pass system $id field', () => {
    const orderByCondition = [['$id', 'desc']];
    const whereCondition = [];

    const result = validateOrderByFields(indexedFields, orderByCondition, whereCondition);

    expect(result).to.be.an('array');
    expect(result).to.be.empty();
  });

  it('should fail with multikey field', () => {
    const orderByCondition = [['arrayWithObjects.flag', 'desc']];
    const whereCondition = [];

    const result = validateOrderByFields(indexedFields, orderByCondition, whereCondition);

    expect(result).to.be.an('array');
    expect(result).to.have.lengthOf(1);
    expect(result[0]).to.equal('arrayWithObjects.flag');
  });

  it('should pass with first field on index and empty where', () => {
    const orderByCondition = [
      ['address', 'asc'],
    ];
    const whereCondition = [];

    const result = validateOrderByFields(indexedFields, orderByCondition, whereCondition);

    expect(result).to.be.an('array');
    expect(result).to.be.empty();
  });

  it('should pass with first field on index and where contains that field', () => {
    const orderByCondition = [['address', 'asc']];
    const whereCondition = [['address', '==', 'myAddress']];

    const result = validateOrderByFields(indexedFields, orderByCondition, whereCondition);

    expect(result).to.be.an('array');
    expect(result).to.be.empty();
  });

  it('should pass with second field on index and where contains first field', () => {
    const orderByCondition = [['firstName', 'desc']];
    const whereCondition = [['$userId', '==', 123]];

    const result = validateOrderByFields(indexedFields, orderByCondition, whereCondition);

    expect(result).to.be.an('array');
    expect(result).to.be.empty();
  });

  it('should order by two fields with where condition', () => {
    const orderByCondition = [['firstName', 'desc'], ['$userId', 'asc']];
    const whereCondition = [['$userId', '==', 123]];

    const result = validateOrderByFields(indexedFields, orderByCondition, whereCondition);

    expect(result).to.be.an('array');
    expect(result).to.be.empty();
  });

  it('should pass order by two fields with empty where', () => {
    const orderByCondition = [['firstName', 'desc'], ['$userId', 'asc']];
    const whereCondition = [];

    const result = validateOrderByFields(indexedFields, orderByCondition, whereCondition);

    expect(result).to.be.an('array');
    expect(result).to.be.empty();
  });

  it('should fail on sort by different indices', async () => {
    const orderByCondition = [
      ['address', 'asc'],
      ['$userId', 'asc'],
    ];
    const whereCondition = [];

    const result = validateOrderByFields(indexedFields, orderByCondition, whereCondition);

    expect(result).to.be.an('array');
    expect(result).to.have.lengthOf(2);
    expect(result).to.deep.members(['address', '$userId']);
  });

  it('should order by single field index in two directions', () => {
    let orderByCondition = [
      ['street', 'asc'],
    ];
    const whereCondition = [];

    let result = validateOrderByFields(indexedFields, orderByCondition, whereCondition);

    expect(result).to.be.an('array');
    expect(result).to.be.empty();

    orderByCondition = [
      ['street', 'desc'],
    ];

    result = validateOrderByFields(indexedFields, orderByCondition, whereCondition);

    expect(result).to.be.an('array');
    expect(result).to.be.empty();
  });

  it('should fail on sort by wrong direction of compound key', async () => {
    const orderByCondition = [['firstName', 'asc'], ['$userId', 'asc']];
    const whereCondition = [];

    const result = validateOrderByFields(indexedFields, orderByCondition, whereCondition);

    expect(result).to.be.an('array');
    expect(result).to.have.lengthOf(2);
    expect(result).to.deep.members(['firstName', '$userId']);
  });

  it('should fail on order by two fields with wrong direction with where condition', () => {
    const orderByCondition = [['firstName', 'desc'], ['$userId', 'desc']];
    const whereCondition = [['$userId', '==', 123]];

    const result = validateOrderByFields(indexedFields, orderByCondition, whereCondition);

    expect(result).to.be.an('array');
    expect(result).to.have.lengthOf(2);
    expect(result).to.deep.members(['firstName', '$userId']);
  });
});
