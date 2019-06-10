'use strict';
/**
 * This service helps in processing the ost events
 *
 * Note:-
 */

const rootPrefix = '../../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  ostEventConstant = require(rootPrefix + '/lib/globalConstant/ostEvent'),
  ActivationSuccessClass = require(rootPrefix + '/app/services/ostEvents/users/ActivationSuccess'),
  FailureTransactionClass = require(rootPrefix + '/app/services/ostEvents/transactions/Failure'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger');

class OstEventProcess extends ServiceBase {
  /**
   * @param {Object} params
   * @param {Object} params.ostEventObj: OST Event Table row
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
      [ostEventConstant.usersActivationSuccessOstWebhookTopic]: ActivationSuccessClass,
      [ostEventConstant.transactionsFailureOstWebhookTopic]: FailureTransactionClass
    };
  }

  /**
   * perform - process Ost Event
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
   *
   * @return {Promise<void>}
   *
   * @private
   */
  async _execute() {
    const oThis = this;

    logger.log('execute class from Ost Event Factory');

    let eventProcessor = oThis.eventClassMapping[oThis.ostEventTopic];

    if (!eventProcessor) {
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 's_oe_f_e_1',
          api_error_identifier: 'something_went_wrong',
          debug_options: { ostEventObjId: oThis.ostEventObj.id, msg: 'Invalid Topic of ost event' }
        })
      );
    }

    let eventProcessResp = await new eventProcessor(oThis.eventData).perform();

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
