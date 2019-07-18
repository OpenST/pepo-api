const rootPrefix = '../../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  UsdPricePointUpdateClass = require(rootPrefix + '/app/services/ostEvents/pricePoints/Usd'),
  EurPricePointUpdateClass = require(rootPrefix + '/app/services/ostEvents/pricePoints/Eur'),
  GbpPricePointUpdateClass = require(rootPrefix + '/app/services/ostEvents/pricePoints/Gbp'),
  FailureTransactionClass = require(rootPrefix + '/app/services/ostEvents/transactions/Failure'),
  SuccessTransactionClass = require(rootPrefix + '/app/services/ostEvents/transactions/Success'),
  ActivationSuccessClass = require(rootPrefix + '/app/services/ostEvents/users/ActivationSuccess'),
  ActivationFailureClass = require(rootPrefix + '/app/services/ostEvents/users/ActivationFailure'),
  ActivationInitiateClass = require(rootPrefix + '/app/services/ostEvents/users/ActivationInitiated'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  ostEventConstants = require(rootPrefix + '/lib/globalConstant/ostEvent');

class OstEventProcess extends ServiceBase {
  /**
   * @param {object} params
   * @param {object} params.ostEventObj: OST Event Table row
   *
   * @augments ServiceBase
   *
   * @constructor
   */
  constructor(params) {
    super(params);

    const oThis = this;

    oThis.ostEventObj = params.ostEventObj;
    oThis.eventData = JSON.parse(oThis.ostEventObj.eventData);

    oThis.ostEventTopic = oThis.eventData.topic;

    oThis.eventClassMapping = {
      [ostEventConstants.usersActivationInitiateOstWebhookTopic]: ActivationInitiateClass,
      [ostEventConstants.usersActivationSuccessOstWebhookTopic]: ActivationSuccessClass,
      [ostEventConstants.usersActivationFailureOstWebhookTopic]: ActivationFailureClass,
      [ostEventConstants.transactionsFailureOstWebhookTopic]: FailureTransactionClass,
      [ostEventConstants.transactionsSuccessOstWebhookTopic]: SuccessTransactionClass,
      [ostEventConstants.usdPricePointUpdatedOstWebhookTopic]: UsdPricePointUpdateClass,
      [ostEventConstants.eurPricePointUpdatedOstWebhookTopic]: EurPricePointUpdateClass,
      [ostEventConstants.gbpPricePointUpdatedOstWebhookTopic]: GbpPricePointUpdateClass
    };
  }

  /**
   * Perform - Process Ost Event.
   *
   * @return {Promise<void>}
   */
  async _asyncPerform() {
    const oThis = this;

    await oThis._execute();

    return Promise.resolve(responseHelper.successWithData({}));
  }

  /**
   * Validate param
   *
   * @return {Promise<void>}
   * @private
   */
  async _execute() {
    const oThis = this;

    logger.log('Execute method from Ost Event Factory.');

    const eventProcessor = oThis.eventClassMapping[oThis.ostEventTopic];

    if (!eventProcessor) {
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 's_oe_f_e_1',
          api_error_identifier: 'something_went_wrong',
          debug_options: { ostEventObjId: oThis.ostEventObj.id, msg: 'Invalid Topic of ost event' }
        })
      );
    }

    const eventProcessResp = await new eventProcessor(oThis.eventData).perform();

    if (eventProcessResp.isFailure()) {
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 's_oe_f_e_2',
          api_error_identifier: 'something_went_wrong',
          debug_options: { eventProcessResp: eventProcessResp, ostEventObj: oThis.ostEventObj }
        })
      );
    }

    return Promise.resolve(responseHelper.successWithData({}));
  }
}

module.exports = OstEventProcess;
