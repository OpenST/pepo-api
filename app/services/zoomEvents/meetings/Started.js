const rootPrefix = '../../../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  createErrorLogsEntry = require(rootPrefix + '/lib/errorLogs/createEntry'),
  errorLogsConstants = require(rootPrefix + '/lib/globalConstant/errorLogs');

/**
 * Class for zoom meeting started webhook processor.
 *
 * @class MeetingStarted
 */
class MeetingStarted extends ServiceBase {
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
    oThis.startTime = params.object.start_time;
    oThis.uuid = params.object.uuid;

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
    // if status == waiting,created -> mark status as started
    //    else -> error

    return responseHelper.successWithData({});
  }
}

module.exports = MeetingStarted;
