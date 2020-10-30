class MerkDbWrapper {
  /**
   *
   * @param {merk} merkDB
   */
  constructor(merkDB) {
    this.db = merkDB;
    this.deleted = new Set();
    this.data = {};
  }

  /**
   *
   * @param {Buffer} key
   * @return {null|Buffer}
   */
  get(key) {
    if (this.deleted[key]) {
      return null;
    }

    const value = this.data[key];
    if (value !== undefined) {
      return value;
    }

    return this.db.getSync(key);
  }

  put(key, value) {
    this.deleted.delete(key);

    this.data[key] = value;
  }

  delete() {
    this.data.delete(key);
    this.deleted.add(key);
  }

  commit() {

  }

  rollback() {

  }
}

module.exports = MerkDbWrapper;
