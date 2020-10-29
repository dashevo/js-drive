const SimplifiedMNListStore = require('@dashevo/dashcore-lib/lib/deterministicmnlist/SimplifiedMNListStore');

class SimplifiedMasternodeList {
  constructor(options) {
    this.options = {
      maxListsLimit: options.smlMaxListsLimit,
    };
  }

  /**
   * @param {SimplifiedMNListDiff[]} smlDiffs
   *
   * @return SimplifiedMasternodeList
   */
  applyDiff(smlDiffs) {
    if (!this.simplifiedMNList) {
      this.simplifiedMNList = new SimplifiedMNListStore(smlDiffs, this.options);
    } else {
      smlDiffs.forEach((diff) => {
        this.simplifiedMNList.addDiff(diff);
      });
    }

    return this;
  }

  /**
   *
   * @return {SimplifiedMNList|undefined}
   */
  getList() {
    return this.simplifiedMNList;
  }
}

module.exports = SimplifiedMasternodeList;
