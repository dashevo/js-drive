/**
 * @param {function} fun
 * @return {throttle}
 */
module.exports = function throttleFactory(fun) {
  let isInProgress = false;
  let wasCalledDuringProgress = false;

  /**
   * @typedef throttle
   * @return {Promise<void>}
   */
  async function throttle() {
    try {
      if (isInProgress) {
        wasCalledDuringProgress = true;

        return;
      }

      isInProgress = true;

      await fun();

      isInProgress = false;

      if (wasCalledDuringProgress) {
        wasCalledDuringProgress = false;
        await throttle();
      }
    } catch (error) {
      isInProgress = false;

      throw error;
    }
  }

  return throttle;
};
