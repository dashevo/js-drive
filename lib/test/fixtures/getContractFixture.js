const Contract = require('@dashevo/dpp/lib/contract/Contract');

/**
 * @return Contract
 */
function getContractFixture() {
  const documents = {
    niceObject: {
      properties: {
        name: {
          type: 'string',
        },
      },
      additionalProperties: false,
    },
    prettyObject: {
      properties: {
        lastName: {
          $ref: '#/definitions/lastName',
        },
      },
      required: ['lastName'],
      additionalProperties: false,
    },
  };

  const contract = new Contract('Contract', documents);

  contract.setDefinitions({
    lastName: {
      type: 'string',
    },
  });

  return contract;
}

module.exports = getContractFixture;
