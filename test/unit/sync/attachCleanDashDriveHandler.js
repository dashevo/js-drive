const attachCleanDashDriveHandler = require('../../../lib/sync/attachCleanDashDriveHandler');

describe('attachCleanDashDriveHandler', () => {
  let stHeadersReader;
  let cleanDashDrive;

  beforeEach(function beforeEach() {
    stHeadersReader = {
      on: (topic, fn) => fn(),
    };
    cleanDashDrive = this.sinon.stub();
    attachCleanDashDriveHandler(stHeadersReader, cleanDashDrive);
  });

  it('should call cleanDashDrive on stHeadersReader event', () => {
    expect(cleanDashDrive).to.be.calledOnce();
  });
});
