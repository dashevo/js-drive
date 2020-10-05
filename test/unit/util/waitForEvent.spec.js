const { expect } = require('chai');
const EventEmitter = require('events');
const waitForEvent = require('../../../lib/util/waitForEvent');

describe('waitForEvent', () => {
  const emitter = new EventEmitter();
  const SOME_EVENT_NAME = 'SOME_EVENT_NAME';
  const SOME_VALUE = 'SOME_VALUE';
  const SOME_OTHER_VALUE = 'SOME_OTHER_VALUE';

  let executeWithWait;
  let executeWithWaitValue;
  beforeEach(() => {
    executeWithWait = async (f) => {
      await waitForEvent(emitter, SOME_EVENT_NAME);
      f();
    };
    executeWithWaitValue = async (f) => {
      await waitForEvent(emitter, SOME_EVENT_NAME, SOME_VALUE);
      f();
    };
  });

  it('should wait until event is emitted', (done) => {
    executeWithWait(done);
    emitter.emit(SOME_EVENT_NAME, SOME_VALUE);
  });
  it('should wait until event with value is emitted', (done) => {
    let executed = false;
    executeWithWaitValue(() => {
      executed = true;
    });
    emitter.emit(SOME_EVENT_NAME, SOME_OTHER_VALUE);
    setTimeout(() => {
      expect(executed).to.equal(false);
      emitter.emit(SOME_EVENT_NAME, SOME_VALUE);
      setTimeout(() => {
        expect(executed).to.equal(true);
        done();
      }, 30);
    }, 30);
  });
});
