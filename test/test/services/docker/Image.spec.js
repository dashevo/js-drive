const DashCoreInstanceOptions = require('../../../../lib/test/services/dashCore/DashCoreInstanceOptions');
const MongoDbInstanceOptions = require('../../../../lib/test/services/mongoDb/MongoDbInstanceOptions');
const Image = require('../../../../lib/test/services/docker/Image');

describe('Image', function main() {
  this.timeout(20000);

  it('should pull image without authentication', async () => {
    const options = new MongoDbInstanceOptions();
    const image = new Image(options);
    await image.pull();
  });

  it('should pull image with authentication', async () => {
    const options = new DashCoreInstanceOptions();
    const image = new Image(options);
    await image.pull();
  });
});
