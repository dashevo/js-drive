const SimplifiedMNList = require('@dashevo/dashcore-lib/lib/deterministicmnlist/SimplifiedMNList');

class SimplifiedMasternodeList {
  constructor() {
    this.simplifiedMNList = new SimplifiedMNList();
  }

  /**
   * @param {SimplifiedMNListDiff} diff
   *
   * @return SimplifiedMasternodeList
   */
  applyDiff(diff) {
    this.simplifiedMNList.applyDiff(diff);

    return this;
  }

  /**
   *
   * @return {SimplifiedMNList}
   */
  getSimplifiedMNList() {
    return this.simplifiedMNList;
  }
}

module.exports = SimplifiedMasternodeList;
