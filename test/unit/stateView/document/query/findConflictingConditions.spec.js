const findConflictingConditions = require('../../../../../lib/stateView/document/query/findConflictingConditions');

describe('findConflictingConditions', () => {
  it('should return empty array if field used with only one operator', () => {
    const result = findConflictingConditions([['field', '==', 'value'], ['field2', '<', 'value2']]);

    expect(result).to.be.an('array');
    expect(result).to.have.lengthOf(0);
  });

  it('should return empty array if field used with "<" and ">" operators');
  it('should return empty array if field used with "<" and ">=" operators');
  it('should return empty array if field used with ">" and "<" operators');
  it('should return empty array if field used with ">" and "<=" operators');
  it('should return array with field if it used with "<" and "<" operators');
  it('should return array with field if it used with ">" and ">" operators');
  it('should return array with field if it used with "<=" and "=>" operators');
  it('should return array with field if it used with two not range comparison operators');
  it('should return array with field if it used with more than two operators');
  it('should return array with field if it used with more than two operators');
});
