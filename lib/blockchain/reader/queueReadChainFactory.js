module.exports = function queueReadChainFactory(readChain, blockIterator) {
  let isInSync = false;
  const queue = [];

  async function queueReadChain(sinceBlockHash) {
    if (isInSync && blockIterator.isDone()) {
      queue.push(sinceBlockHash);
      return;
    }

    if (isInSync) {
      return;
    }

    queue.push(sinceBlockHash);

    for (const blockHash of queue) {
      queue.pop();
      isInSync = true;
      try {
        await readChain(blockHash);
      } finally {
        isInSync = false;
      }
    }
  }

  return queueReadChain;
};
