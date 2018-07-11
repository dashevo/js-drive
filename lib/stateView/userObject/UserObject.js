const requiredProperties = [
  'id', 'packetId', 'merkleTreeLeafNumber', 'blockHeight', 'userName', 'id',
  'type', 'hash', 'data', 'revision', ' relatedUserNames', 'createdAt', 'updatedAt',
];

module.exports = class UserObject {
  constructor(data) {
    requiredProperties.forEach((property) => {
      if (!Object.prototype.hasOwnProperty.call(data, property)) {
        throw new Error(`${property} is required`);
      }
    });

    Object.assign(this, data);
  }
};
