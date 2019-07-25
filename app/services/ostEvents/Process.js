const rootPrefix = '../../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  OstEventModel = require(rootPrefix + '/app/models/mysql/OstEvent'),
  ostEventConstant = require(rootPrefix + '/lib/globalConstant/ostEvent'),
  OstEventProcessFactory = require(rootPrefix + '/app/services/ostEvents/Factory'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger');

class OstEventProcess extends ServiceBase {
  /**
   * @param {object} params
   * @param {string} params.ostEventId: OST Event Table Id
   *
   * @constructor
   */
  constructor(params) {
    super(params);

    const oThis = this;

    oThis.ostEventId = params.ostEventId;

    oThis.ostEventObj = null;
  }

  /**
   * Perform - Process Ost Event.
   *
   * @return {Promise<void>}
   */
  async _asyncPerform() {
    const oThis = this;

    await oThis._validateAndSanitizeParams();

    await oThis._fetchOstEvent();

    await oThis._updateOstEventStatus(ostEventConstant.startedStatus);

    await oThis._processEvent();

    return responseHelper.successWithData({});
  }

  /**
   * Validate param
   *
   *
   * @return {Promise<void>}
   *
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

    return Promise.resolve(responseHelper.successWithData({}));
  }

  /**
   * Fetch Entry from Ost Event Table
   *
   *
   * @return {Promise<void>}
   *
   * @private
   */
  async _fetchOstEvent() {
    const oThis = this;
    logger.log('fetch entry for Ost Event process');

    let dbRow = await new OstEventModel().fetchById(oThis.ostEventId);

    if (!dbRow || !dbRow.id || dbRow.status !== ostEventConstant.pendingStatus) {
      logger.error('Error while fetching data from ost events table. dbRows=', dbRow);

      return Promise.reject(dbRow);
    }

    oThis.ostEventObj = dbRow;

    return Promise.resolve(responseHelper.successWithData({}));
  }

  /**
   * Update status of ost event row.
   *
   * @return {Promise<void>}
   * @private
   */
  async _updateOstEventStatus(ostEventStatus) {
    const oThis = this;
    logger.log('Update Ost Event status-', ostEventStatus);

    let ostEventstatus = ostEventConstant.invertedStatuses[ostEventStatus];

    if (!ostEventstatus) {
      throw new Error(`Invalid ostEventstatus for Process. ostEventStatus=${ostEventStatus}`);
    }

    await new OstEventModel()
      .update({ status: ostEventstatus })
      .where({ id: oThis.ostEventId })
      .fire();

    return Promise.resolve(responseHelper.successWithData({}));
  }

  /**
   * Use Factory To process Event.
   *
   * @return {Promise<void>}
   * @private
   */
  async _processEvent() {
    const oThis = this;

    logger.log('Process Ost Event');

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
      await oThis._updateOstEventStatus(ostEventConstant.doneStatus);
    } else {
      await oThis._updateOstEventStatus(ostEventConstant.failedStatus);
    }

    return responseHelper.successWithData({});
  }
}

module.exports = OstEventProcess;
