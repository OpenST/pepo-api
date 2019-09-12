/**
 * Locations table seeder.
 *
 * Usage: node ./executables/oneTimers/locationSeeder.js
 *
 */

const rootPrefix = '../..',
  LocationModel = require(rootPrefix + '/app/models/mysql/Location'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger');

const momentTimezone = require('moment-timezone');

const BATCH_SIZE = 25;

class LocationSeeder {
  /**
   * Async performer.
   *
   * @returns {Promise<boolean>}
   */
  async perform() {
    const oThis = this;

    return oThis._seed();
  }

  /**
   * Seed locations.
   *
   * @returns {Promise<boolean>}
   * @private
   */
  async _seed() {
    const timezoneNames = momentTimezone.tz.names();

    logger.log('timezoneNames =====', timezoneNames);

    while (timezoneNames.length > 0) {
      const bulkInsertVal = [],
        currentZones = timezoneNames.splice(0, BATCH_SIZE);

      for (let i = 0; i < currentZones.length; i++) {
        const gmtOffset = momentTimezone.tz(currentZones[i]).utcOffset() * 60;

        logger.log('gmtOffset =====', gmtOffset);

        bulkInsertVal.push([gmtOffset, currentZones[i].toLowerCase()]);
      }

      await new LocationModel()
        .insertMultiple(['gmt_offset', 'time_zone'], bulkInsertVal)
        .onDuplicate({ updated_at: Math.round(new Date() / 1000) })
        .fire();
    }
  }
}

const locationSeeder = new LocationSeeder();

locationSeeder
  .perform()
  .then(function(data) {
    logger.log('\nSuccess data: ', data);
    process.exit(0);
  })
  .catch(function(err) {
    logger.error('\nError data: ', err);
    process.exit(1);
  });
