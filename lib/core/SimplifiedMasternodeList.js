const SimplifiedMNListStore = require('@dashevo/dashcore-lib/lib/deterministicmnlist/SimplifiedMNListStore');

class SimplifiedMasternodeList {
  constructor(options) {
    this.options = {
      maxListsLimit: options.smlMaxListsLimit,
    };
  }

  /**
   * @param {SimplifiedMNListDiff[]} simplifiedMNListDiffArray
   *
   * @return SimplifiedMasternodeList
   */
  applyDiff(simplifiedMNListDiffArray) {
    if (!this.simplifiedMNList) {
      this.simplifiedMNList = new SimplifiedMNListStore(simplifiedMNListDiffArray, this.options);
    } else {
      simplifiedMNListDiffArray.forEach((diff) => {
        this.simplifiedMNList.addDiff(diff);
      });
    }

    return this;
  }

  /**
   *
   * @return {SimplifiedMNList|undefined}
   */
  getSimplifiedMNList() {
    return this.simplifiedMNList;
  }
}

module.exports = SimplifiedMasternodeList;
