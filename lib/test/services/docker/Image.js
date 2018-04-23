const Docker = require('dockerode');
const EcrRegistry = require('./EcrRegistry');

class Image {
  constructor(options) {
    this.docker = new Docker();
    this.registry = new EcrRegistry();
    this.image = options.getImageName();
    this.authorization = options.getImageAuthorization();
  }

  /**
   * Pull image
   *
   * @return {Promise<void>}
   */
  async pull() {
    return new Promise(async (resolve, reject) => {
      try {
        if (this.authorization) {
          const authconfig = await this.registry.getAuthorizationToken();
          const stream = await this.docker.pull(this.image, { authconfig });
          return this.docker.modem.followProgress(stream, resolve);
        }

        const stream = await this.docker.pull(this.image);
        return this.docker.modem.followProgress(stream, resolve);
      } catch (error) {
        return reject(error);
      }
    });
  }
}

module.exports = Image;
