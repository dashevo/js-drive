const IsolatedDashPlatformProtocol = require('./IsolatedDashPlatformProtocol');
const bootstrapIsolateFromSnapshot = require('./bootstrapIsolateFromSnapshot');
const IsolatedJsonSchemaValidator = require('./IsolatedJsonSchemaValidator');

/**
 * @param {ExternalCopy<ArrayBuffer>} isolatedJsonSchemaValidatorSnapshot
 * @param {Object} isolatedSTUnserializationOptions
 * @param [isolatedSTUnserializationOptions.timeout] - Timeout ms
 * @param [isolatedSTUnserializationOptions.memoryLimit] - Memory limit mb
 * @param {DataProvider} dataProvider
 * @return {createIsolatedDpp}
 */
function createIsolatedDppFactory(
  isolatedJsonSchemaValidatorSnapshot,
  isolatedSTUnserializationOptions,
  dataProvider,
) {
  /**
   * @typedef {createIsolatedDpp}
   * @return {Promise<IsolatedDashPlatformProtocol>}
   */
  async function createIsolatedDpp() {
    const { context, isolate } = await bootstrapIsolateFromSnapshot(
      isolatedJsonSchemaValidatorSnapshot,
      isolatedSTUnserializationOptions,
    );

    try {
      const jsonSchemaValidator = new IsolatedJsonSchemaValidator(
        context,
        isolatedSTUnserializationOptions.timeout,
      );

      return new IsolatedDashPlatformProtocol(
        isolate,
        { dataProvider, jsonSchemaValidator },
      );
    } catch (e) {
      if (!isolate.isDisposed) {
        isolate.dispose();
      }

      throw e;
    }
  }

  return createIsolatedDpp;
}

module.exports = createIsolatedDppFactory;
