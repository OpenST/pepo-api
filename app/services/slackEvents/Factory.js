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
   * @param {object} params.current_admin: User Admin
   *
   * @augments ServiceBase
   *
   * @constructor
   */
  constructor(params) {
    super();

    const oThis = this;

    oThis.eventData = params.webhookParams;
    oThis.currentAdmin = params.current_admin;

    oThis.eventType = null;
    oThis.eventParams = {};
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

    await oThis._extractEventTopic();

    await oThis._execute();

    return responseHelper.successWithData({});
  }

  /**
   * Validate and sanitize parameters.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _validateAndSanitizeParams() {
    const oThis = this;

    logger.log('Validate for salck events factory');

    if (!oThis.eventData || !CommonValidators.validateNonEmptyObject(oThis.eventData)) {
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 'a_s_se_f_1',
          api_error_identifier: 'something_went_wrong'
        })
      );
    }
  }

  /**
   * Extract event topic.
   *
   * @sets oThis.eventType, oThis.eventParams
   *
   * @returns {Promise<never>}
   * @private
   */
  async _extractEventTopic() {
    const oThis = this;

    const action = oThis.eventData.payload.actions[0].value,
      splittedAction = action.split('|'),
      eventType = splittedAction[0];

    splittedAction.splice(0, 1);

    oThis.eventType = eventType;

    // Add validation for allowed event topics.
    if (slackConstants.allowedEventTypes.indexOf(oThis.eventType) === -1) {
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 'a_s_se_f_eet_1',
          api_error_identifier: 'something_went_wrong',
          debug_options: { eventType: oThis.eventType, msg: 'Invalid slack event type' }
        })
      );
    }

    for (let ind = 0; ind < splittedAction.length; ind++) {
      const param = splittedAction[ind],
        splittedParam = param.split(':'),
        key = splittedParam[0],
        value = splittedParam[1];

      oThis.eventParams[key] = value;
    }
  }

  /**
   * Validate params.
   *
   * @return {Promise<void>}
   * @private
   */
  // eslint-disable-next-line max-lines-per-function
  async _execute() {
    const oThis = this;

    let eventResponse = null;

    switch (oThis.eventType) {
      case slackConstants.unmuteUserEventType: {
        const UnmuteUserEvent = require(rootPrefix + '/app/services/slackEvents/UnmuteUser');
        eventResponse = await new UnmuteUserEvent({
          eventDataPayload: oThis.eventData.payload,
          eventParams: oThis.eventParams,
          currentAdmin: oThis.currentAdmin
        }).perform();
        break;
      }
      case slackConstants.approveUserEventType: {
        const ApproveUserEvent = require(rootPrefix + '/app/services/slackEvents/ApproveUser');
        eventResponse = await new ApproveUserEvent({
          eventDataPayload: oThis.eventData.payload,
          eventParams: oThis.eventParams,
          currentAdmin: oThis.currentAdmin
        }).perform();
        break;
      }
      case slackConstants.deleteUserEventType: {
        const DeleteUserEvent = require(rootPrefix + '/app/services/slackEvents/DeleteUser');
        eventResponse = await new DeleteUserEvent({
          eventDataPayload: oThis.eventData.payload,
          eventParams: oThis.eventParams,
          currentAdmin: oThis.currentAdmin
        }).perform();
        break;
      }
      case slackConstants.deleteVideoEventType: {
        const DeleteVideoEvent = require(rootPrefix + '/app/services/slackEvents/DeleteVideo');
        eventResponse = await new DeleteVideoEvent({
          eventDataPayload: oThis.eventData.payload,
          eventParams: oThis.eventParams,
          currentAdmin: oThis.currentAdmin
        }).perform();
        break;
      }
      case slackConstants.deleteReplyEventType: {
        const DeleteReplyEvent = require(rootPrefix + '/app/services/slackEvents/DeleteReply');
        eventResponse = await new DeleteReplyEvent({
          eventDataPayload: oThis.eventData.payload,
          eventParams: oThis.eventParams,
          currentAdmin: oThis.currentAdmin
        }).perform();
        break;
      }
      case slackConstants.sendEmailEventType: {
        const SendEmailForResubmissionEvent = require(rootPrefix +
          '/app/services/slackEvents/SendEmailForResubmission');
        eventResponse = await new SendEmailForResubmissionEvent({
          eventDataPayload: oThis.eventData.payload,
          eventParams: oThis.eventParams,
          currentAdmin: oThis.currentAdmin
        }).perform();
        break;
      }
      case slackConstants.hideChannelEventType: {
        const HideChannelEvent = require(rootPrefix + '/app/services/slackEvents/channel/Hide');
        eventResponse = await new HideChannelEvent({
          eventDataPayload: oThis.eventData.payload,
          eventParams: oThis.eventParams,
          currentAdmin: oThis.currentAdmin
        }).perform();
        break;
      }
      case slackConstants.unhideChannelEventType: {
        const UnhideChannelEvent = require(rootPrefix + '/app/services/slackEvents/channel/Unhide');
        eventResponse = await new UnhideChannelEvent({
          eventDataPayload: oThis.eventData.payload,
          eventParams: oThis.eventParams,
          currentAdmin: oThis.currentAdmin
        }).perform();
        break;
      }
      case slackConstants.deleteChannelEventType: {
        const DeleteChannelEvent = require(rootPrefix + '/app/services/slackEvents/channel/Delete');
        eventResponse = await new DeleteChannelEvent({
          eventDataPayload: oThis.eventData.payload,
          eventParams: oThis.eventParams,
          currentAdmin: oThis.currentAdmin
        }).perform();
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
      return Promise.reject(eventResponse);
    }

    return eventResponse;
  }
}

module.exports = SlackEventFactory;
