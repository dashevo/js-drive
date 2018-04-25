const DashCoreInstanceOptions = require('../../../../lib/test/services/dashCore/DashCoreInstanceOptions');
const MongoDbInstanceOptions = require('../../../../lib/test/services/mongoDb/MongoDbInstanceOptions');
const EcrRegistry = require('../../../../lib/test/services/docker/EcrRegistry');
const Image = require('../../../../lib/test/services/docker/Image');

describe('Image', function main() {
  this.timeout(20000);


  it('should pull image without authentication', async () => {
    const options = new MongoDbInstanceOptions();
    const imageName = options.getImageName();
    const image = new Image(imageName);
    await image.pull();
  });

  it('should pull image with authentication', async () => {
    const options = new DashCoreInstanceOptions();
    const imageName = options.getImageName();
    const registry = new EcrRegistry(process.env.AWS_DEFAULT_REGION);
    const authorizationToken = await registry.getAuthorizationToken();
    const image = new Image(imageName, authorizationToken);
    await image.pull();
  });
});
