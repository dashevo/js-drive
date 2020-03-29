const { Isolate } = require('isolated-vm');
const allocateRandomMemory = require('../../../../../lib/test/util/allocateRandomMemory');
const waitShim = require('../../../../../lib/test/util/setTimeoutShim');

const invokeFunctionFromIsolate = require('../../../../../lib/dpp/isolation/dpp/invokeFunctionFromIsolate');

describe('invokeFunctionFromIsolate', function describe() {
  let isolate;
  let context;
  let jail;
  let timeoutFromIsolate;

  this.timeout(100000);

  beforeEach(async () => {
    isolate = new Isolate({ memoryLimit: 50 });

    context = await isolate.createContext();

    ({ global: jail } = context);

    await jail.set('global', jail.derefInto());

    await context.eval(`global.wait = ${waitShim}`);

    await context.eval(`
      global.infiniteLoop = function infiniteLoop() {
        while(true) {}
        return;
      };
    `);

    await context.evalClosure(`
      global.setTimeout = function(timeout) {
        return $0.apply(undefined, [timeout], { result: { promise: true } });
      }`,
    [timeout => new Promise((resolve) => {
      timeoutFromIsolate = setTimeout(resolve, timeout);
    })], { arguments: { reference: true } });

    await context.eval(`
      global.allocateRandomMemory = ${allocateRandomMemory}
    `);
  });

  afterEach(() => {
    if (!isolate.isDisposed) {
      isolate.dispose();
    }
  });

  it('should stop execution after a timeout for an async function', async () => {
    const timeout = 2000;
    let error;

    const timeStart = Date.now();
    try {
      await invokeFunctionFromIsolate(
        context,
        '',
        'wait',
        [5000],
        { timeout, result: { promise: true } },
      );
    } catch (e) {
      error = e;
    }

    const timeSpent = Date.now() - timeStart;

    expect(error).to.be.instanceOf(Error);
    expect(error.message).to.be.equal('Script execution timed out.');
    expect(timeSpent >= timeout).to.be.true();
    expect(timeSpent).to.be.lessThan(timeout + 1000);
  });

  it('should stop execution after a timeout for an async function that makes call to an external reference', async () => {
    const timeout = 2000;
    let error;

    const timeStart = Date.now();

    try {
      await invokeFunctionFromIsolate(
        context,
        '',
        'setTimeout',
        [100000],
        { timeout, result: { promise: true } },
      );
    } catch (e) {
      error = e;
    }

    clearTimeout(timeoutFromIsolate);

    const timeSpent = Date.now() - timeStart;

    expect(error).to.be.instanceOf(Error);
    expect(error.message).to.be.equal('Script execution timed out.');

    expect(timeSpent >= timeout).to.be.true();
    expect(timeSpent).to.be.lessThan(timeout + 1000);
  });

  it('should stop execution after a timeout for a sync function running inside the isolate', async () => {
    const timeout = 2000;
    const timeStart = Date.now();
    let error;

    try {
      await invokeFunctionFromIsolate(
        context,
        '',
        'infiniteLoop',
        [],
        { timeout, result: { promise: true } },
      );
    } catch (e) {
      error = e;
    }
    const timeSpent = Date.now() - timeStart;

    expect(error).to.be.instanceOf(Error);
    expect(error.message).to.be.equal('Script execution timed out.');

    expect(timeSpent >= timeout).to.be.true();
    expect(timeSpent).to.be.lessThan(timeout + 1000);
  });

  it('should not stop execution if memory utilization is less than limit', async () => {
    await invokeFunctionFromIsolate(
      context,
      '',
      'allocateRandomMemory',
      // 45 mb should be fine, as the limit set in beforeEach hook is 50
      [45 * 1000 * 1000],
      { result: { promise: true } },
    );
  });

  it('should stop execution if memory is exceeded', async () => {
    let error;

    try {
      // 180 mb, while our limit is 50 mb
      const memoryToAllocate = 180 * 1000 * 1000;

      await invokeFunctionFromIsolate(
        context,
        '',
        'allocateRandomMemory',
        [memoryToAllocate],
        { result: { promise: true } },
      );
    } catch (e) {
      error = e;
    }

    expect(error).to.be.instanceOf(Error);
    expect(error.message).to.be.equal('Isolate was disposed during execution due to memory limit');
  });
});
