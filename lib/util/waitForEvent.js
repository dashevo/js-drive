/**
 * Asynchronously wait for an event to be fired.
 * @param {EventEmitter} emitter - emitter of the event
 * @param {String} eventName - eventName to wait for
 * @return {Promise<void>} The promise to await on.
 */
async function waitForEvent(emitter, eventName) {
  return new Promise((resolve) => {
    emitter.on(eventName, resolve);
  });
}

module.exports = waitForEvent;
