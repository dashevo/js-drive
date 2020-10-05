/**
 * Asynchronously wait for an event to be fired.
 * @param {EventEmitter} emitter - emitter of the event
 * @param {String} eventName - eventName to wait for
 * @param {String} [value] - Optionally will verify value to equal response
 * @return {Promise<any>} The promise to await on.
 */
async function waitForEvent(emitter, eventName, value) {
  return new Promise((resolve) => {
    emitter.on(eventName, (response) => {
      if (value === undefined || value === response) {
        resolve(response);
      }
    });
  });
}

module.exports = waitForEvent;
