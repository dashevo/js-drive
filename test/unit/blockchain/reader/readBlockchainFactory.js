describe('readBlockchainFactory', () => {
  it('should emit the out of bounds event if initial block height less than number of blocks in blockchain');
  it('should reset state and emit out of bounds events if initial block height less and Drive synced something before');
  it('should emit the fully synced event if the last synced block and the last block from the chain are the same');
  it('should read from the blockchain height if it less than the last sync block');
  it('should read from the next block after the last synced block');
  it('should read from initial block height');
});
