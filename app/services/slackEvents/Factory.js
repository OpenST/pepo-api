const rootPrefix = '../../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  slackConstants = require(rootPrefix + '/lib/globalConstant/slack');

/**
 * Class to process slack event.
 *
 * @class SlackEventFactory
 */
class SlackEventFactory extends ServiceBase {
  /**
   * Constructor to process slack event.
   *
   * @param {object} params
   * @param {object} params.webhookParams: webhook params
   *
   * @augments ServiceBase
   *
   * @constructor
   */
  constructor(params) {
    super(params);

    const oThis = this;

    oThis.eventData = params.webhookParams;
    oThis.eventType = null;
    oThis.eventParams = {};
  }

  /**
   * Perform - Process Ost Event.
   *
   * @return {Promise<void>}
   */
  async _asyncPerform() {
    const oThis = this;

    await oThis._validateAndSanitizeParams();

    await oThis._extractEventTopic();

    await oThis._execute();

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

    logger.log('Validate for salck events factory');

    if (!oThis.eventData || !CommonValidators.validateString(oThis.eventData)) {
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 'a_s_se_f_1',
          api_error_identifier: 'something_went_wrong'
        })
      );
    }

    return Promise.resolve(responseHelper.successWithData({}));
  }

  /**
   * Extract event topic.
   *
   * @returns {Promise<never>}
   * @private
   */
  async _extractEventTopic() {
    const oThis = this;

    let action = oThis.eventData.actions[0].value,
      splittedAction = action.split('|'),
      eventType = splittedAction[0],
      actionParams = splittedAction[1],
      splittedActionParams = actionParams.split('|');

    oThis.eventType = eventType;

    // add validation for allowed event topics
    if (slackConstants.allowedEventTypes.indexOf(oThis.eventType) == -1) {
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 'a_s_se_f_eet_1',
          api_error_identifier: 'something_went_wrong',
          debug_options: { eventType: oThis.eventType, msg: 'Invalid slack event type' }
        })
      );
    }

    for (let i = 0; i < splittedActionParams.length; i++) {
      let param = splittedActionParams[i],
        splittedParam = param.split(':'),
        key = splittedParam[0],
        value = splittedParam[1];

      oThis.eventParams[key] = value;
    }

    return responseHelper.successWithData({});
  }

  /**
   * Validate param.
   *
   * @return {Promise<void>}
   * @private
   */
  async _execute() {
    const oThis = this;
    let eventResponse = null;

    switch (oThis.eventType) {
      case slackConstants.approveUserEventType: {
        const ApproveUserClass = require(rootPrefix + '/app/services/slackEvents/ApproveUser');
        eventResponse = await new ApproveUserClass(oThis.eventParams).perform();
        break;
      }
      case slackConstants.blockUserEventType: {
        const BlockUserClass = require(rootPrefix + '/app/services/slackEvents/BlockUser');
        eventResponse = await new BlockUserClass(oThis.eventParams).perform();
        break;
      }
      case slackConstants.deleteVideoEventType: {
        const DeleteVideoClass = require(rootPrefix + '/app/services/slackEvents/DeleteVideo');
        eventResponse = await new DeleteVideoClass(oThis.eventParams).perform();
        break;
      }
      default: {
        return Promise.reject(
          responseHelper.error({
            internal_error_identifier: 'a_s_se_f_e_1',
            api_error_identifier: 'something_went_wrong',
            debug_options: { eventType: oThis.eventType, msg: 'Invalid slack event type' }
          })
        );
      }
    }

    if (eventResponse.isFailure()) {
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 'a_s_se_f_e_2',
          api_error_identifier: 'something_went_wrong',
          debug_options: { eventResponse: eventResponse, eventData: oThis.eventData }
        })
      );
    }
  }
}

module.exports = SlackEventFactory;
