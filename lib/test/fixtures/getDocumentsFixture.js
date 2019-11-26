const DocumentFactory = require('@dashevo/dpp/lib/document/DocumentFactory');

const getDataContractFixture = require('./getDataContractFixture');

const contract = getDataContractFixture();

/**
 * @return {Document[]}
 */
function getDocumentsFixture() {
  const validateDocumentStub = () => {};
  const fetchAndValidateDataContractStub = () => {};

  const factory = new DocumentFactory(
    validateDocumentStub,
    fetchAndValidateDataContractStub,
  );

  return [
    factory.create(contract, contract.getId(), 'niceDocument', { name: 'Cutie' }),
    factory.create(contract, contract.getId(), 'prettyDocument', { lastName: 'Shiny' }),
    factory.create(contract, contract.getId(), 'prettyDocument', { lastName: 'Sweety' }),
  ];
}

module.exports = getDocumentsFixture;
module.exports.userId = contract.getId();
