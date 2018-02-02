/**
 * Get user object by revision.
 *
 * If it current version then we obtain data just from state view.
 * Overwise we have to get data from storage (IPFS) also.
 *
 * @param {string} id Object ID
 * @param {string} revision Revision #
 * @return {UserObject}
 */
module.exports = function getUserObjectByRevision(id, revision) {

};