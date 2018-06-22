const cleanDashDriveFactory = require('../../../lib/sync/cleanDashDriveFactory');

describe('cleanDashDriveFactory', () => {
  let unpinAllPacketsSpy;
  let dropDriveMongoDatabasesSpy;
  beforeEach(function beforeEach() {
    unpinAllPacketsSpy = this.sinon.spy();
    dropDriveMongoDatabasesSpy = this.sinon.spy();
  });

  it('should clean DashDrive', async () => {
    const cleanDashDrive = cleanDashDriveFactory(unpinAllPacketsSpy, dropDriveMongoDatabasesSpy);
    await cleanDashDrive();

    expect(unpinAllPacketsSpy).to.calledOnce();
    expect(dropDriveMongoDatabasesSpy).to.calledOnce();
  });
});
