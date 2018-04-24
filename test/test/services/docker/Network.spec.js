const Docker = require('dockerode');

const MongoDbInstanceOptions = require('../../../../lib/test/services/mongoDb/MongoDbInstanceOptions');
const Network = require('../../../../lib/test/services/docker/Network');

describe('Image', () => {
  it('should create a network according to options', async () => {
    const options = new MongoDbInstanceOptions();
    const network = new Network(options);

    await network.create();

    const dockerNetwork = new Docker().getNetwork(options.getNetworkName());
    const { Name, Driver } = await dockerNetwork.inspect();

    expect(Name).to.equal(options.getNetworkName());
    expect(Driver).to.equal(options.getNetworkDriver());
  });

  it('should not fail creating a network that already exists', async () => {
    const options = new MongoDbInstanceOptions();
    const network = new Network(options);

    await network.create();

    const dockerNetwork = new Docker().getNetwork(options.getNetworkName());
    const { Name, Driver } = await dockerNetwork.inspect();

    expect(Name).to.equal(options.getNetworkName());
    expect(Driver).to.equal(options.getNetworkDriver());
  });
});
