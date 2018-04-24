const EcrRegistry = require('../../../../lib/test/services/docker/EcrRegistry');

describe('EcrRegistry', () => {
  const registry = new EcrRegistry(process.env.AWS_DEFAULT_REGION);

  it('should get the authorization', async () => {
    const authorization = await registry.getAuthorizationToken();
    expect(authorization.username).to.exist();
    expect(authorization.password).to.exist();
    expect(authorization.serveraddress).to.exist();
  });
});
