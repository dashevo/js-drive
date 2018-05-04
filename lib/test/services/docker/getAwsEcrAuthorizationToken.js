const ECR = require('aws-sdk/clients/ecr');
const util = require('util');

/**
 * Get ECR authorization
 *
 * @param {String} region
 * @return {Promise<{ username, password, serveraddress }>}
 */
async function getAwsEcrAuthorizationToken(region) {
  const registry = new ECR({ region });

  const getAuthorizationToken = util.promisify(registry.getAuthorizationToken).bind(registry);

  const {
    authorizationData: [{ authorizationToken, proxyEndpoint: serveraddress }],
  } = await getAuthorizationToken();

  const creds = Buffer.from(authorizationToken, 'base64').toString();

  const [username, password] = creds.split(':');

  return {
    username,
    password,
    serveraddress,
  };
}

module.exports = getAwsEcrAuthorizationToken;
