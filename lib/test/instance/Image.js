const Docker = require('dockerode');
const ImageRegistry = require('./ImageRegistry');

class Image extends ImageRegistry {
  constructor({ name, authorization = false } = {}) {
    super();

    this.docker = new Docker();
    this.image = name;
    this.authorization = authorization;
  }

  async pull() {
    return new Promise(async (resolve, reject) => {
      try {
        if (this.authorization) {
          const authconfig = await this.getAuthorizationToken();
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
