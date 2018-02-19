const { expect } = require('chai');
const promisifyMethods = require('../../lib/util/promisifyMethods');

describe('Util', () => {
  describe('promisifyMethods', () => {
    it('should promisify passed object methods', () => {
      const testObject = {
        testMethod1(callback) {
          callback(null, 'result');
        },
        testMethod2(callback) {
          callback(new Error('error'));
        },
      };

      const promisifiedObject = promisifyMethods(testObject, ['testMethod1', 'testMethod2']);

      expect(promisifiedObject).to.be.an('object');

      expect(promisifiedObject).to.respondTo('testMethod1');
      expect(promisifiedObject).to.respondTo('testMethod2');

      expect(promisifiedObject.testMethod1()).to.be.a('Promise');
      expect(promisifiedObject.testMethod2()).to.be.a('Promise');
    });
  });
});
