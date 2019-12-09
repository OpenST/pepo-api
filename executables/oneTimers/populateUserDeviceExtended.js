const rootPrefix = '../..',
  UserDeviceModel = require(rootPrefix + '/app/models/mysql/UserDevice'),
  UserDeviceExtendedDetailModel = require(rootPrefix + '/app/models/mysql/UserDeviceExtendedDetail'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger');

class populateUserDeviceExtended {
  /**
   * Perform.
   *
   * @returns {Promise<void>}
   */
  async perform() {
    const oThis = this;

    const dbRows = await new UserDeviceModel().select('*').fire();

    for (let i = 0; i < dbRows.length; i++) {
      const dbRow = dbRows[i];
      const insertParams = {
        deviceId: dbRow.device_id,
        userId: dbRow.user_id
      };
      await new UserDeviceExtendedDetailModel().createNewEntry(insertParams).catch(function(err) {
        console.log('\n\n Mostly already present for: ', JSON.stringify(dbRow));
      });
    }
  }
}

new populateUserDeviceExtended()
  .perform()
  .then(function() {
    logger.win('All Devices recorded.');
    process.exit(0);
  })
  .catch(function(err) {
    logger.error('Devices recording failed. Error: ', err);
    process.exit(1);
  });
