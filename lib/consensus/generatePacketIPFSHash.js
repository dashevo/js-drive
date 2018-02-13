const { importer } = require('ipfs-unixfs-engine');
const pull = require('pull-stream');
const CID = require('cids');
const packetToIPFSFiles = require('./packetToIPFSfiles');

// TODO Use cbor codec instead of protobuf (dag-pb) ?

function prepareFile(file, callback) {
  callback(file);

  // opts = opts || {}
  //
  // waterfall([
  //   (cb) => self.object.get(file.multihash, cb),
  //   (node, cb) => {
  //     let cid = new CID(node.multihash)
  //
  //     if (opts['cid-version'] === 1) {
  //       cid = cid.toV1()
  //     }
  //
  //     const b58Hash = cid.toBaseEncodedString()
  //
  //     cb(null, {
  //       path: file.path || b58Hash,
  //       hash: b58Hash,
  //       size: node.size
  //     })
  //   }
  // ], callback)
}

function createPacketIPFSNode(files) {
  return new Promise((resolve) => {
    pull(
      pull.values([files]),
      pull.flatten(),
      importer({}, { onlyHash: true }),
      pull.asyncMap(prepareFile),
      pull.collect(resolve),
    );
  });
}

module.exports = async function generatePacketIPFSHash(packet) {
  const files = packetToIPFSFiles(packet);

  const packetNode = await createPacketIPFSNode(files);

  const cid = new CID(0, 'dag-pb', packetNode.multihash);

  return cid.toBaseEncodedString();
};

//
// Get file hash example
//
// const CID = require('cids');
// const fs = require('fs');
// const path = require('path');
// const multihashing = require('multihashing-async');
//
// const file = fs.readFileSync(path.join(__dirname, 'test.protobuf'));
//
// multihashing(file, 'sha2-256', (err, multihash) => {
//   if (err) {
//     return console.error(err);
//   }
//
//   const cid = new CID(0, 'dag-pb', multihash);
//
//   console.log(cid.toBaseEncodedString());
// });
//
// QmTEzo7FYzUCd5aq7bGKoMLfsbbsebpfARRZd4Znejb25R
//
