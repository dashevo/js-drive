class MerkDbTransactionWrapper {
  /**
   *
   * @param {Merk} merkDB
   */
  constructor(merkDB) {
    this.db = merkDB;
    this.deleted = new Set();
    this.data = new Map();
  }

  /**
   *
   * @param {Buffer} key
   * @return {null|Buffer}
   */
  get(key) {
    if (this.deleted[key.toString('hex')]) {
      return null;
    }

    const value = this.data.get(key.toString('hex'));
    if (value !== undefined) {
      return value;
    }

    return this.db.getSync(key);
  }

  /**
   *
   * @param {Buffer} key
   * @param {*} value
   *
   * @return {MerkDbTransactionWrapper}
   */
  put(key, value) {
    this.deleted.delete(key.toString('hex'));

    this.data.set(key.toString('hex'), value);

    return this;
  }

  /**
   *
   * @param {Buffer} key
   *
   * @return {MerkDbTransactionWrapper}
   */
  delete(key) {
    this.data.delete(key.toString('hex'));
    this.deleted.add(key.toString('hex'));

    return this;
  }

  /**
   *
   * @return {MerkDbTransactionWrapper}
   */
  commit() {
    let batch = this.db.batch();

    // store values
    for (const [key, value] of this.data) {
      batch = batch.put(Buffer.from(key, 'hex'), value);
    }

    // remove keys
    for (const key of this.deleted) {
      batch = batch.delete(Buffer.from(key, 'hex'));
    }

    // commit
    batch.commitSync();

    // remove data from transaction
    this.data.clear();
    this.deleted.clear();

    return this;
  }

  /**
   *
   * @return {MerkDbTransactionWrapper}
   */
  rollback() {
    this.data.clear();
    this.deleted.clear();

    return this;
  }
}

module.exports = MerkDbTransactionWrapper;
