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
    oThis.ostEventTopic = oThis.ostEventObj.topic;

    oThis.eventClassMapping = {
      [ostEventConstant.usersActivationSuccess]: ActivationSuccessClass
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

    let eventData = JSON.parse(oThis.ostEventObj.event_data());
    let eventProcessResp = await new eventProcessor(eventData).perform();

    if (eventProcessResp.isFailure()) {
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 's_oe_f_e_1',
          api_error_identifier: 'something_went_wrong',
          debug_options: { eventProcessResp: eventProcessResp, ostEventObj: oThis.ostEventObj }
        })
      );
    }

    return Promise.resolve(responseHelper.successWithData({}));
  }
}

module.exports = OstEventProcess;
