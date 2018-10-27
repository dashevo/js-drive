describe('BlockchainReader', () => {
  it('should set block height to the block iterator');
  it('should iterate over the blocks and state transitions and set iterated blocks to state');
  it('should emit error if error happens during iteration');
  it('should restart reading if RestartBlockchainReaderError thrown from the error event handlers');
});
