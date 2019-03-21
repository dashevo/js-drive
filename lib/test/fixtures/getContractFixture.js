const Contract = require('@dashevo/dpp/lib/contract/Contract');

/**
 * @return Contract
 */
function getContractFixture() {
  const dpObjectsDefinition = {
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

  const dpContract = new Contract('Contract', dpObjectsDefinition);

  dpContract.setDefinitions({
    lastName: {
      type: 'string',
    },
  });

  return dpContract;
}

module.exports = getContractFixture;
