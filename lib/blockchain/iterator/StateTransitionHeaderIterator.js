// TODO: It might be part of SDK in the future

const StateTransitionHeader = require('../StateTransitionHeader');

class StateTransitionHeaderIterator {
  /**
   * @param {Iterator} blockIterator
   * @param {RpcClient} rpcClient
   */
  constructor(blockIterator, rpcClient) {
    this.blockIterator = blockIterator;

    this.rpcClient = rpcClient;

    this.reset(true);
  }

  /**
   * Reset iterator
   */
  reset(onlyHeaders = false) {
    if (!onlyHeaders) {
      this.blockIterator.reset();
    }

    this.currentBlock = null;
    this.currentTransactionIndex = 0;
  }

  /**
   * Get next ST header
   *
   * @return {Promise<Object>}
   */
  async next() {
    for (; ;) {
      if (!this.currentBlock) {
        const { done, value: block } = await this.blockIterator.next();

        if (done) {
          return {
            done: true,
            value: {
              header: null,
              block: null,
            },
          };
        }

        this.currentBlock = block;
        this.currentTransactionIndex = 0;
      }

      const transactionId = this.currentBlock.tx[this.currentTransactionIndex];

      if (transactionId) {
        const {
          result: serializedTransactionHeader,
        } = await this.rpcClient.getRawTransaction(transactionId);

        this.currentTransactionIndex++;

        const header = new StateTransitionHeader(serializedTransactionHeader);

        if (header.type !== StateTransitionHeader.TYPES.TRANSACTION_SUBTX_TRANSITION) {
          // eslint-disable-next-line no-continue
          continue;
        }

        return {
          done: false,
          value: {
            header,
            block: this.currentBlock,
          },
        };
      }

      this.currentBlock = null;
    }
  }
}

module.exports = StateTransitionHeaderIterator;
