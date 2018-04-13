const path = require('path');
const { expect, use } = require('chai');
const sinon = require('sinon');
const sinonChai = require('sinon-chai');
const dirtyChai = require('dirty-chai');
const chaiAsPromised = require('chai-as-promised');

use(dirtyChai);
use(sinonChai);
use(chaiAsPromised);

process.env.NODE_ENV = 'test';
require('dotenv').config({
  path: path.resolve(__dirname, '..', '..', '.env'),
});

beforeEach(function beforeEach() {
  if (!this.sinon) {
    this.sinon = sinon.sandbox.create();
  } else {
    this.sinon.restore();
  }
});

global.expect = expect;
