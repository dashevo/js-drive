describe('readBlockchainFactory', () => {
  it('should initially read whole chain available');
  it('should emit out of bounds event if chain is behind');
  it('should reset state in case it is not empty and chain is behind');
  it('should emit fully synced event in case it has state and last block hash matches one on the blockchain');
  it('should check for impossibility of sequence validation and reset state if any');
  it('should proceed to the next block if chain has one');
  it('should restart reading blockchain in case sequence validation is impossible');
  it('should throw an error and stop syncing in case unknown error is thrown during read');
});
