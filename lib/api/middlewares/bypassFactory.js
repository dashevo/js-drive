/**
 * @param {Function} fn
 * @param {Array} methods
 * @returns {bypass}
 */
function bypassFactory(fn, methods) {
  /**
   * @typedef {Promise} bypass
   * @param req
   * @param res
   * @param next
   * @returns {Promise<void>}
   */
  async function byPass(req, res, next) {
    if (methods.includes(req.body.method)) {
      return next();
    }
    return fn(req, res, next);
  }

  return byPass;
}

module.exports = bypassFactory;
