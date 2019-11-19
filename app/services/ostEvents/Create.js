const rootPrefix = '../../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  OstEventModel = require(rootPrefix + '/app/models/mysql/OstEvent'),
  bgJob = require(rootPrefix + '/lib/rabbitMqEnqueue/bgJob'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  bgJobConstants = require(rootPrefix + '/lib/globalConstant/bgJob'),
  ostEventConstants = require(rootPrefix + '/lib/globalConstant/ostEvent');

/**
 * Class to create new ost event.
 *
 * @class OstEventCreate
 */
class OstEventCreate extends ServiceBase {
  /**
   * Constructor to create new ost event.
   *
   * @param {object} params
   * @param {object} params.webhookParams
   * @param {object} params.eventData
   * @param {number} params.eventData.id
   *
   * @augments ServiceBase
   *
   * @constructor
   */
  constructor(params) {
    super();

    const oThis = this;

    oThis.eventData = params.webhookParams;
    oThis.eventId = oThis.eventData.id;

    oThis.ostEventId = null;
    oThis.duplicateEvent = false;
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

    if (oThis.duplicateEvent) {
      return responseHelper.successWithData({});
    }

    await oThis._createEntryInOstEvent();

    await oThis._publishOstEvent();

    return responseHelper.successWithData({});
  }

  /**
   * Validate request.
   *
   * @sets oThis.duplicateEvent
   *
   * @returns {Promise<void>}
   * @private
   */
  async _validateAndSanitizeParams() {
    const oThis = this;

    logger.log('Validate for ost events.');

    if (!oThis.eventId || !CommonValidators.validateString(oThis.eventId)) {
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 's_oe_c_vas_1',
          api_error_identifier: 'something_went_wrong'
        })
      );
    }

    const ostEventRes = await new OstEventModel().fetchByEventId(oThis.eventId);

    if (ostEventRes.id) {
      oThis.duplicateEvent = true;
    }
  }

  /**
   * Create entry in ost event table.
   *
   * @sets oThis.ostEventId
   *
   * @returns {Promise<void>}
   * @private
   */
  async _createEntryInOstEvent() {
    const oThis = this;

    logger.log('Create entry in Ost Event.');

    const stringifiedEventData = JSON.stringify(oThis.eventData);

    // Insert in database.
    const insertResponse = await new OstEventModel()
      .insert({
        event_id: oThis.eventId,
        status: ostEventConstants.invertedStatuses[ostEventConstants.pendingStatus.toUpperCase()],
        event_data: stringifiedEventData
      })
      .fire();

    if (!insertResponse) {
      logger.error('Error while inserting data in ost_events table');

      return Promise.reject(insertResponse);
    }

    oThis.ostEventId = insertResponse.insertId;
  }

  /**
   * Publish ost event ID.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _publishOstEvent() {
    const oThis = this;

    logger.log('Publish Ost Event');

    const messagePayload = {
      ostEventId: oThis.ostEventId
    };

    await bgJob.enqueue(bgJobConstants.ostWebhookJobTopic, messagePayload);
  }
}

module.exports = OstEventCreate;
