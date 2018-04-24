const ECR = require('aws-sdk/clients/ecr');

class EcrRegistry {
  constructor(region) {
    this.registry = new ECR({ region });
  }

  /**
   * Get ECR authorization
   *
   * @return {Promise<authorization>}
   */
  async getAuthorizationToken() {
    return new Promise((resolve, reject) => {
      this.registry.getAuthorizationToken((error, authorization) => {
        if (error) {
          return reject(error);
        }
        const {
          authorizationToken,
          proxyEndpoint: serveraddress,
        } = authorization.authorizationData[0];
        const creds = Buffer.from(authorizationToken, 'base64').toString();
        const [username, password] = creds.split(':');
        return resolve({ username, password, serveraddress });
      });
    });
  }
}

module.exports = EcrRegistry;
