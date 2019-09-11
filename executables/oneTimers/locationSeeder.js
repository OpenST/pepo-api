/**
 * Locations table seeder.
 *
 * Usage: node ./executables/oneTimers/locationSeeder.js
 *
 */

const rootPrefix = '../..',
  basicHelper = require(rootPrefix + '/helpers/basic'),
  LocationModel = require(rootPrefix + '/app/models/mysql/Location'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger');

const command = require('commander'),
  path = require('path'),
  appRootPath = path.resolve(__dirname, rootPrefix);

command
  .usage('[options]')
  .option('--location-file-path <required>', 'Location json file absolute path')
  .parse(process.argv);

const BATCH_SIZE = 25;

class LocationSeeder {
  /**
   *
   * @param {Object} params
   * @param {String} params.locationFilePath
   */
  constructor(params) {
    const oThis = this;

    oThis.locationFilePath = params.locationFilePath;
  }

  /**
   * Async performer.
   *
   * @returns {Promise<boolean>}
   */
  async perform() {
    const oThis = this;

    if (oThis.locationFilePath === undefined) {
      oThis.locationFilePath = `${appRootPath}/test/location.json`;
    }

    return oThis._seed();
  }

  /**
   * Seed locations.
   *
   * @returns {Promise<boolean>}
   * @private
   */
  async _seed() {
    const oThis = this;

    const locationData = require(oThis.locationFilePath),
      zoneInfoArray = locationData.zones;

    while (zoneInfoArray.length > 0) {
      const bulkInsertVal = [],
        currentZones = zoneInfoArray.splice(0, BATCH_SIZE);

      for (let i = 0; i < currentZones.length; i++) {
        bulkInsertVal.push([currentZones[i].gmtOffset, currentZones[i].zoneName]);
      }

      await new LocationModel()
        .insertMultiple(['gmt_offset', 'time_zone'], bulkInsertVal)
        .onDuplicate({ updated_at: Math.round(new Date() / 1000) })
        .fire();
    }
  }
}

const locationSeeder = new LocationSeeder({ locationFilePath: command.locationFilePath });

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
