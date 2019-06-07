'use strict';
/**
 * This service helps in creating the ost events from webhooks
 *
 * Note:-
 */

const rootPrefix = '../../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  OstEventModel = require(rootPrefix + '/app/models/mysql/OstEvent'),
  ProcessOstEventClass = require(rootPrefix + '/app/services/ostEvents/Process'),
  ostEventConstant = require(rootPrefix + '/lib/globalConstant/ostEvent'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger');

class OstEventCreate extends ServiceBase {
  /**
   * @param {Object} params
   *
   * @constructor
   */
  constructor(params) {
    super(params);

    const oThis = this;

    oThis.eventData = params;
    oThis.eventId = oThis.eventData.id;

    oThis.ostEventId = null;
    oThis.duplicateEvent = false;
  }

  /**
   * perform - Validate Login Credentials
   *
   * @return {Promise<void>}
   */
  async _asyncPerform() {
    const oThis = this;

    await oThis._validateAndSanitizeParams();

    if (oThis.duplicateEvent) {
      return responseHelper.successWithData({});
    }

    await oThis._createEntryInOstEvent();

    await oThis._publishOstEvent();

    return Promise.resolve(responseHelper.successWithData({}));
  }

  /**
   * Validate Request
   *
   *
   * @return {Promise<void>}
   *
   * @private
   */
  async _validateAndSanitizeParams() {
    const oThis = this;

    logger.log('Validate for ost events');

    if (!oThis.eventId || !CommonValidators.validateString(oThis.eventId)) {
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 's_oe_c_vas_1',
          api_error_identifier: 'something_went_wrong'
        })
      );
    }

    let dbRows = await new OstEventModel()
      .select(['id'])
      .where({ event_id: oThis.eventId })
      .fire();

    if (dbRows.length > 0) {
      oThis.duplicateEvent = true;
    }

    return Promise.resolve(responseHelper.successWithData({}));
  }

  /**
   * Create Entry In Ost Event Table
   *
   *
   * @return {Promise<void>}
   *
   * @private
   */
  async _createEntryInOstEvent() {
    const oThis = this;
    logger.log('Create entry in Ost Event');

    let stringifiedEventData = JSON.stringify(oThis.eventData);

    // Insert in database
    let insertResponse = await new OstEventModel()
      .insert({
        event_id: oThis.eventId,
        status: ostEventConstant.invertedStatuses[ostEventConstant.pendingStatus.toUpperCase()],
        event_data: stringifiedEventData
      })
      .fire();

    if (!insertResponse) {
      logger.error('Error while inserting data in ost_events table');
      return Promise.reject(insertResponse);
    }

    oThis.ostEventId = insertResponse.insertId;

    return Promise.resolve(responseHelper.successWithData({}));
  }

  /**
   * Publish Ost Event ID
   *
   *
   * @return {Promise<void>}
   *
   * @private
   */
  async _publishOstEvent() {
    const oThis = this;
    logger.log('Publish Ost Event');

    await new ProcessOstEventClass({ ostEventId: oThis.ostEventId }).perform();

    return Promise.resolve(responseHelper.successWithData({}));
  }
}

module.exports = OstEventCreate;
