describe('validateBlockSequenceFactory', () => {
  it('should restart reader from initial block if previous synced block is not present'
    + 'and current block is not initial');
  it('should restart reader from initial block if current block less than previous synced block'
  + 'and out of synced block limit');
  it('should restart from reader from previous block if blocks sequence is not correct');
  it('should restart from reader from current block if it lower than last synced block');
  it('should pass if previous block is not present and current is initial');
  it('should pass if blocks sequence is correct');
});
