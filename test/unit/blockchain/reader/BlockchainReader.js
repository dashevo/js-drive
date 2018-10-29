describe('BlockchainReader', () => {
  it('should set block height of the block iterator');
  it('should iterate over the blocks and state transitions and add iterated blocks to the state');
  it('should emit error if error happens during iteration');
  it('should restart reading if RestartBlockchainReaderError thrown from the error event handlers');
});
