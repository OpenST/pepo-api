/**
 *
 * @module executables/oneTimers/2020_03_23_populateZoomRelayers
 */
const program = require('commander');

const rootPrefix = '../..',
  MeetingRelayerModel = require(rootPrefix + '/app/models/mysql/meeting/MeetingRelayer'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  meetingRelayerConstants = require(rootPrefix + '/lib/globalConstant/meeting/meetingRelayer');

program.option('--zoomRelayers <zoomRelayers>', 'Array of meeting relayers to populate.').parse(process.argv);

program.on('--help', function() {
  logger.log('');
  logger.log('  Example:');
  logger.log('');
  logger.log(' node executables/oneTimers/2020_03_23_populateMeetingRelayers.js --zoomRelayers <zoomRelayers>');
  logger.log('');
  logger.log('');
});

if (!program.zoomRelayers) {
  program.help();
  process.exit(1);
}

/**
 * One timer class to create zoom users in meeting_relayers table.
 *
 * @class PopulateMeetingRelayers
 */
class PopulateZoomRelayers {
  /**
   * Constructor.
   *
   * @param {object} params
   *
   * @constructor
   */
  constructor(params) {
    const oThis = this;

    logger.log(`Input zoom relayers: ${params.zoomRelayers}`);

    oThis.zoomRelayers = JSON.parse(params.zoomRelayers);
  }

  /**
   * Main performer for class.
   *
   * @returns {Promise<void>}
   */
  async perform() {
    const oThis = this;

    await oThis.populateRelayersInTable();
  }

  /**
   * Function to populate meeting_relayers table.
   *
   * @returns {Promise<never>}
   */
  async populateRelayersInTable() {
    const oThis = this;

    const currentTime = Math.floor(Date.now() / 1000);

    for (let ind = 0; ind < oThis.zoomRelayers.length; ind++) {
      const zoomRelayer = oThis.zoomRelayers[ind];
      const insertResponse = await new MeetingRelayerModel()
        .insert({
          zoom_user_id: zoomRelayer.id,
          email: zoomRelayer.email,
          status: meetingRelayerConstants.invertedStatuses[meetingRelayerConstants.availableStatus],
          created_at: currentTime,
          updated_at: currentTime
        })
        .fire();
      if (insertResponse) {
        logger.log(`Created zoom relayer: ${zoomRelayer.id}`);
      } else {
        return Promise.reject(
          new Error(`Error while inserting zoom user id: ${zoomRelayer.id} in meeting_relayers table.`)
        );
      }
    }
  }
}

new PopulateZoomRelayers({ zoomRelayers: program.zoomRelayers })
  .perform()
  .then(function() {
    logger.log('Meeting relayers populated successfully!!!');
    process.exit(0);
  })
  .catch(function(err) {
    logger.log(err);
    process.exit(1);
  });
