'use strict';
/**
 * This service helps in processing the ost events
 *
 * Note:-
 */

const rootPrefix = '../../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  OstEventModel = require(rootPrefix + '/app/models/mysql/OstEvent'),
  ostEventConstant = require(rootPrefix + '/lib/globalConstant/ostEvent'),
  OstEventProcessFactory = require(rootPrefix + '/app/services/ostEvents/Factory'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger');

class OstEventProcess extends ServiceBase {
  /**
   * @param {Object} params
   * @param {String} params.ostEventId: OST Event Table Id
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
   * perform - process Ost Event
   *
   * @return {Promise<void>}
   */
  async _asyncPerform() {
    const oThis = this;

    await oThis._validateAndSanitizeParams();
    await oThis._fetchOstEvent();

    try {
      await oThis._updateOstEventStatus(ostEventConstant.startedStatus);
      await oThis._processEvent();
    } catch (err) {
      logger.error('In catch block of ost events process, Err-', err);
      await oThis._updateOstEventStatus(ostEventConstant.failedStatus);
    }

    return Promise.resolve(responseHelper.successWithData({}));
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
          internal_error_identifier: 's_oe_c_vas_1',
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

    let dbRows = await new OstEventModel().fetchById(oThis.ostEventId);

    if (!dbRows || !dbRows.id || dbRows.status != ostEventConstant.pendingStatus) {
      logger.error('Error while fetching data from ost events table. dbRows=', dbRows);
      return Promise.reject(dbRows);
    }

    oThis.ostEventObj = dbRows;

    return Promise.resolve(responseHelper.successWithData({}));
  }

  /**
   * Update status of ost event row
   *
   *
   * @return {Promise<void>}
   *
   * @private
   */
  async _updateOstEventStatus(ostEventStatus) {
    const oThis = this;
    logger.log('Update Ost Event status-', ostEventStatus);

    let ostEventstatus = ostEventConstant.invertedStatuses[ostEventStatus];

    if (!ostEventstatus) {
      throw `Invalid ostEventstatus for Process. ostEventStatus=${ostEventStatus}`;
    }

    await new OstEventModel()
      .update({ status: ostEventstatus })
      .where({ id: oThis.ostEventId })
      .fire();

    return Promise.resolve(responseHelper.successWithData({}));
  }

  /**
   * Use Factory To process Event
   *
   *
   * @return {Promise<void>}
   *
   * @private
   */
  async _processEvent() {
    const oThis = this;
    logger.log('Process Ost Event');

    let r = await new OstEventProcessFactory({ ostEventObj: oThis.ostEventObj }).perform();

    if (r.isSuccess()) {
      await oThis._updateOstEventStatus(ostEventConstant.doneStatus);
    } else {
      await oThis._updateOstEventStatus(ostEventConstant.failedStatus);
    }

    return Promise.resolve(responseHelper.successWithData({}));
  }
}

module.exports = OstEventProcess;
