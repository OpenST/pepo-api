const rootPrefix = '../../../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  createErrorLogsEntry = require(rootPrefix + '/lib/errorLogs/createEntry'),
  errorLogsConstants = require(rootPrefix + '/lib/globalConstant/errorLogs');

/**
 * Class for zoom meeting ended webhook processor.
 *
 * @class MeetingEnded
 */
class MeetingEnded extends ServiceBase {
  /**
   * Constructor
   *
   * @param {object} params
   *
   * @augments ServiceBase
   *
   * @constructor
   */
  constructor(params) {
    super(params);

    const oThis = this;

    console.log('HERE====constructor===MeetingStarted======', JSON.stringify(params));
  }

  /**
   * Async performer.
   *
   * @return {Promise<void>}
   */
  async _asyncPerform() {
    const oThis = this;

    //get meeting by zoom_meeting_id= uuid.
    // if status == ended -> error
    //    else -> update meetings status to ended; end timestamp;
    // in meeting relayers. mark zoom_user_id as available from reserved

    return responseHelper.successWithData({});
  }
}

module.exports = MeetingEnded;
