const SimplifiedMNListStore = require('@dashevo/dashcore-lib/lib/deterministicmnlist/SimplifiedMNListStore');

class SimplifiedMasternodeList {
  constructor(options) {
    this.options = {
      maxListsLimit: options.smlMaxListsLimit,
    };

    this.sml = undefined;
  }

  /**
   * @param {SimplifiedMNListDiff[]} smlDiffs
   *
   * @return SimplifiedMasternodeList
   */
  applyDiffs(smlDiffs) {
    if (!this.sml) {
      this.sml = new SimplifiedMNListStore(smlDiffs, this.options);
    } else {
      smlDiffs.forEach((diff) => {
        this.sml.addDiff(diff);
      });
    }

    return this;
  }

  /**
   *
   * @return {SimplifiedMNList}
   */
  getList() {
    return this.sml;
  }
}

module.exports = SimplifiedMasternodeList;
