/**
 * Clean DashDrive handler
 *
 * @param {STHeadersReader} stHeadersReader
 * @param {cleanDashDrive} cleanDashDrive
 */
function attachCleanDashDriveHandler(stHeadersReader, cleanDashDrive) {
  stHeadersReader.on('reset', async () => {
    await cleanDashDrive(process.env.MONGODB_DB_PREFIX);
  });
}

module.exports = attachCleanDashDriveHandler;
