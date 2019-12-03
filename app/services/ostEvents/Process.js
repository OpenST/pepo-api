const rootPrefix = '../../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  OstEventModel = require(rootPrefix + '/app/models/mysql/OstEvent'),
  OstEventProcessFactory = require(rootPrefix + '/app/services/ostEvents/Factory'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  ostEventConstants = require(rootPrefix + '/lib/globalConstant/ostEvent');

/**
 * Class to process ost events.
 *
 * @class OstEventProcess
 */
class OstEventProcess extends ServiceBase {
  /**
   * Constructor to process ost events.
   *
   * @param {object} params
   * @param {string} params.ostEventId: OST Event Table Id
   *
   * @augments ServiceBase
   *
   * @constructor
   */
  constructor(params) {
    super();

    const oThis = this;

    oThis.ostEventId = params.ostEventId;

    oThis.ostEventObj = {};
  }

  /**
   * Async perform.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _asyncPerform() {
    const oThis = this;

    await oThis._validateAndSanitizeParams();

    await oThis._fetchOstEvent();

    await oThis._updateOstEventStatus(ostEventConstants.startedStatus);

    await oThis._processEvent();

    return responseHelper.successWithData({});
  }

  /**
   * Validate parameters.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _validateAndSanitizeParams() {
    const oThis = this;

    logger.log('Validate for ost events process');

    if (!oThis.ostEventId || !CommonValidators.validateInteger(oThis.ostEventId)) {
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 's_oe_p_vas_1',
          api_error_identifier: 'something_went_wrong'
        })
      );
    }
  }

  /**
   * Fetch entry from ost event table.
   *
   * @sets oThis.ostEventObj
   *
   * @returns {Promise<void>}
   * @private
   */
  async _fetchOstEvent() {
    const oThis = this;
    logger.log('fetch entry for Ost Event process');

    const dbRow = await new OstEventModel().fetchById(oThis.ostEventId);

    if (!dbRow || !dbRow.id || dbRow.status !== ostEventConstants.pendingStatus) {
      logger.error('Error while fetching data from ost events table. dbRows=', dbRow);

      return Promise.reject(dbRow);
    }

    oThis.ostEventObj = dbRow;
  }

  /**
   * Update status of ost event row.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _updateOstEventStatus(ostEventStatus) {
    const oThis = this;

    logger.log('Update Ost Event status-', ostEventStatus);

    const ostEventstatus = ostEventConstants.invertedStatuses[ostEventStatus];

    if (!ostEventstatus) {
      throw new Error(`Invalid ostEventstatus for Process. ostEventStatus=${ostEventStatus}`);
    }

    await new OstEventModel()
      .update({ status: ostEventstatus })
      .where({ id: oThis.ostEventId })
      .fire();
  }

  /**
   * Use factory to process event.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _processEvent() {
    const oThis = this;

    logger.log('Process Ost Event.');

    const response = await new OstEventProcessFactory({ ostEventObj: oThis.ostEventObj })
      .perform()
      .catch(async function(err) {
        logger.error(err);

        return responseHelper.error({
          internal_error_identifier: 's_oe_p_vas_2',
          api_error_identifier: 'something_went_wrong',
          debug_options: { Error: err }
        });
      });

    if (response.isSuccess()) {
      await oThis._updateOstEventStatus(ostEventConstants.doneStatus);
    } else {
      //todo: create error log
      await oThis._updateOstEventStatus(ostEventConstants.failedStatus);
    }
  }
}

module.exports = OstEventProcess;
