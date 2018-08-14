const isDashCoreRunningFactory = require('../../../lib/sync/isDashCoreRunningFactory');
const { startDashCore } = require('js-evo-services-ctl').mocha;

describe('IsDashCoreRunning', () => {
  let dashCoreInstance;
  let isDashCoreRunning;

  startDashCore().then((instance) => {
    dashCoreInstance = instance;
  });

  beforeEach(() => {
    isDashCoreRunning = isDashCoreRunningFactory(dashCoreInstance.getApi());
  });

  it('should return true if DashCore is running', async () => {
    const isRunning = await isDashCoreRunning();
    expect(isRunning).to.be.true();
  });

  it('should return false if DashCore is down', async () => {
    await dashCoreInstance.stop();

    const isRunning = await isDashCoreRunning();
    expect(isRunning).to.be.false();
  });
});
