const rootPrefix = '../../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  ostEventConstants = require(rootPrefix + '/lib/globalConstant/ostEvent');

/**
 * Class to process OST event.
 *
 * @class OstEventProcess
 */
class OstEventProcess extends ServiceBase {
  /**
   * Constructor to process OST event.
   *
   * @param {object} params
   * @param {object} params.ostEventObj: OST Event Table row
   *
   * @augments ServiceBase
   *
   * @constructor
   */
  constructor(params) {
    super();

    const oThis = this;

    oThis.ostEventObj = params.ostEventObj;

    oThis.eventData = {};
    oThis.ostEventTopic = '';
  }

  /**
   * Async perform.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _asyncPerform() {
    const oThis = this;

    await oThis._extractEventTopic();

    await oThis._execute();

    return responseHelper.successWithData({});
  }

  /**
   * Extract event topic.
   *
   * @sets oThis.eventData, oThis.ostEventTopic
   *
   * @returns {Promise<never>}
   * @private
   */
  async _extractEventTopic() {
    const oThis = this;

    try {
      oThis.eventData = JSON.parse(oThis.ostEventObj.eventData);
      oThis.ostEventTopic = oThis.eventData.topic;
    } catch (err) {
      logger.error('Error in JSON Parse: ', err);

      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 's_oe_f_e_3',
          api_error_identifier: 'something_went_wrong',
          debug_options: { Error: err }
        })
      );
    }
  }

  /**
   * Validate parameters.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _execute() {
    const oThis = this;

    let eventProcessResponse = null;

    switch (oThis.ostEventTopic) {
      case ostEventConstants.usersActivationInitiateOstWebhookTopic: {
        const ActivationInitiateClass = require(rootPrefix + '/app/services/ostEvents/users/ActivationInitiated');
        eventProcessResponse = await new ActivationInitiateClass(oThis.eventData).perform();
        break;
      }
      case ostEventConstants.usersActivationSuccessOstWebhookTopic: {
        const ActivationSuccessClass = require(rootPrefix + '/app/services/ostEvents/users/ActivationSuccess');
        eventProcessResponse = await new ActivationSuccessClass(oThis.eventData).perform();
        break;
      }
      case ostEventConstants.usersActivationFailureOstWebhookTopic: {
        const ActivationFailureClass = require(rootPrefix + '/app/services/ostEvents/users/ActivationFailure');
        eventProcessResponse = await new ActivationFailureClass(oThis.eventData).perform();
        break;
      }
      case ostEventConstants.transactionsFailureOstWebhookTopic: {
        const TransactionWebhookFailureFactory = require(rootPrefix +
          '/app/services/ostEvents/transactions/failure/Factory');
        eventProcessResponse = await new TransactionWebhookFailureFactory(oThis.eventData).perform();
        break;
      }
      case ostEventConstants.transactionsSuccessOstWebhookTopic: {
        const TransactionWebhookSuccessFactory = require(rootPrefix +
          '/app/services/ostEvents/transactions/success/Factory');
        eventProcessResponse = await new TransactionWebhookSuccessFactory(oThis.eventData).perform();
        break;
      }
      case ostEventConstants.usdPricePointUpdatedOstWebhookTopic: {
        const PricePointsUsdClass = require(rootPrefix + '/app/services/ostEvents/pricePoints/Usd');
        eventProcessResponse = await new PricePointsUsdClass(oThis.eventData).perform();
        break;
      }
      case ostEventConstants.eurPricePointUpdatedOstWebhookTopic: {
        const PricePointsEurClass = require(rootPrefix + '/app/services/ostEvents/pricePoints/Eur');
        eventProcessResponse = await new PricePointsEurClass(oThis.eventData).perform();
        break;
      }
      case ostEventConstants.gbpPricePointUpdatedOstWebhookTopic: {
        const PricePointsGbpClass = require(rootPrefix + '/app/services/ostEvents/pricePoints/Gbp');
        eventProcessResponse = await new PricePointsGbpClass(oThis.eventData).perform();
        break;
      }
      case ostEventConstants.devicesRecoveryInitiateWebhookTopic: {
        const RecoveryInitiateClass = require(rootPrefix + '/app/services/ostEvents/recovery/Initiate');
        eventProcessResponse = await new RecoveryInitiateClass(oThis.eventData).perform();
        break;
      }
      default: {
        return Promise.reject(
          responseHelper.error({
            internal_error_identifier: 's_oe_f_e_1',
            api_error_identifier: 'something_went_wrong',
            debug_options: { ostEventObjId: oThis.ostEventObj.id, msg: 'Invalid topic of ost event.' }
          })
        );
      }
    }

    if (eventProcessResponse.isFailure()) {
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 's_oe_f_e_2',
          api_error_identifier: 'something_went_wrong',
          debug_options: { eventProcessResp: eventProcessResponse, ostEventObj: oThis.ostEventObj }
        })
      );
    }
  }
}

module.exports = OstEventProcess;
