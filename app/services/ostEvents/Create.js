const rootPrefix = '../../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  OstEventModel = require(rootPrefix + '/app/models/mysql/OstEvent'),
  // ProcessOstEventClass = require(rootPrefix + '/app/services/ostEvents/Process'),
  bgJob = require(rootPrefix + '/lib/rabbitMqEnqueue/bgJob'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  bgJobConstants = require(rootPrefix + '/lib/globalConstant/bgJob'),
  ostEventConstant = require(rootPrefix + '/lib/globalConstant/ostEvent');

class OstEventCreate extends ServiceBase {
  /**
   * @param {object} params
   *
   * @constructor
   */
  constructor(params) {
    super(params);

    const oThis = this;

    oThis.eventData = params.webhookParams;
    oThis.eventId = oThis.eventData.id;

    oThis.ostEventId = null;
    oThis.duplicateEvent = false;
  }

  /**
   * Perform - Validate Login Credentials.
   *
   * @return {Promise<void>}
   * @private
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
   * Validate request.
   *
   * @return {Promise<void>}
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

    let ostEventRes = await new OstEventModel().fetchByEventId(oThis.eventId);

    if (ostEventRes.id) {
      oThis.duplicateEvent = true;
    }

    return Promise.resolve(responseHelper.successWithData({}));
  }

  /**
   * Create entry in Ost Event Table.
   *
   * @return {Promise<void>}
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
   * Publish Ost Event ID.
   *
   * @return {Promise<void>}
   * @private
   */
  async _publishOstEvent() {
    const oThis = this;

    logger.log('Publish Ost Event');

    const messagePayload = {
      ostEventId: oThis.ostEventId
    };

    await bgJob.enqueue(bgJobConstants.ostWebhookJobTopic, messagePayload);

    //await new ProcessOstEventClass({ ostEventId: oThis.ostEventId }).perform();

    return Promise.resolve(responseHelper.successWithData({}));
  }
}

module.exports = OstEventCreate;
