const SyncEventBus = require('../blockchain/reader/BlockchainReaderMediator');
const ArrayBlockIterator = require('../blockchain/iterator/ArrayBlockIterator');
const STIterator = require('../blockchain/iterator/STIterator');

const PinPacketTimeoutError = require('./errors/PinPacketTimeoutError');

const rejectAfter = require('../util/rejectAfter');

/**
 * Add State Transition Packet from blockchain when new ST header will appear.
 * Remove State Transition Packet from blockchain when wrong sequence.
 * Remove all State Transition Packets from blockchain when reset.
 *
 * @param {SyncEventBus} syncEventBus
 * @param {IpfsAPI} ipfsAPI
 * @param {RpcClient} rpcClient
 * @param {unpinAllIpfsPackets} unpinAllIpfsPackets
 * @param {number} ipfsPinTimeout
 */
function attachStorageHandlers(
  syncEventBus,
  ipfsAPI,
  rpcClient,
  unpinAllIpfsPackets,
  ipfsPinTimeout,
) {
  syncEventBus.on(SyncEventBus.EVENTS.STATE_TRANSITION, async ({ stateTransition }) => {
    const packetPath = stateTransition.getPacketCID().toBaseEncodedString();

    const pinPromise = ipfsAPI.pin.add(packetPath, { recursive: true });
    const error = new PinPacketTimeoutError();

    await rejectAfter(pinPromise, error, ipfsPinTimeout);
  });

  syncEventBus.on(SyncEventBus.EVENTS.BLOCK_STALE, async (block) => {
    const blockIterator = new ArrayBlockIterator([block]);
    const stIterator = new STIterator(blockIterator, rpcClient);

    let done;
    let header;

    // eslint-disable-next-line no-cond-assign
    while ({ done, value: header } = await stIterator.next()) {
      if (done) {
        break;
      }

      const packetPath = header.getPacketCID().toBaseEncodedString();
      await ipfsAPI.pin.rm(packetPath, { recursive: true });
    }
  });

  syncEventBus.on(SyncEventBus.EVENTS.RESET, async () => {
    await unpinAllIpfsPackets();
  });
}

module.exports = attachStorageHandlers;
