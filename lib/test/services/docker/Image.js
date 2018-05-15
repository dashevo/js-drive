class Image {
  /**
   * Create Docker image
   *
   * @param {Docker} docker
   * @param {String} image
   * @param {Object} authorizationToken
   */
  constructor(docker, image, authorizationToken = null) {
    this.docker = docker;
    this.image = image;
    this.authorizationToken = authorizationToken;
  }

  /**
   * Pull image
   *
   * @return {Promise<void>}
   */
  async pull() {
    return new Promise(async (resolve, reject) => {
      try {
        if (this.authorizationToken) {
          const stream = await this.docker.pull(this.image, {
            authconfig: this.authorizationToken,
          });
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
