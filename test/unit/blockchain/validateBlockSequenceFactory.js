describe('validateBlockSequenceFactory', () => {
  it('should throw error if previous block is not present and current block is not initial');
  it('should throw error if current block less than previous block and out of synced block limit');
  it('should throw error if blocks sequence is not correct');
  it('should not throw error if previous block is not present and current is initial');
  it('should not throw error if blocks sequence is correct');
});
