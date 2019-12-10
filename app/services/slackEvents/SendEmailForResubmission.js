const rootPrefix = '../../..',
  SlackEventBase = require(rootPrefix + '/app/services/slackEvents/Base'),
  SendEmailForReSubmissionService = require(rootPrefix + '/app/services/admin/SendEmailForReSubmission'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  slackConstants = require(rootPrefix + '/lib/globalConstant/slack');

/**
 * Class to process send email for resubmission reply event.
 *
 * @class SendEmailForResubmission
 */
class SendEmailForResubmission extends SlackEventBase {
  /**
   * Constructor to process send email for resubmission reply event.
   *
   * @param {object} params
   * @param {object} params.eventParams: event params
   *
   * @augments ServiceBase
   *
   * @constructor
   */
  constructor(params) {
    super(params);

    const oThis = this;

    oThis.errMsg = null;
  }

  /**
   * Perform - Process Slack Event.
   *
   * @return {Promise<void>}
   */
  async _asyncPerform() {
    const oThis = this;

    await oThis._validateAndSanitizeParams();

    await oThis._callSendEmailForResubmissionService();

    await oThis._postResponseToSlack();

    return responseHelper.successWithData({});
  }

  /**
   * Call send email for resubmission service
   *
   * @returns {Promise<*>}
   * @private
   */
  async _callSendEmailForResubmissionService() {
    const oThis = this,
      sendEmailForResubmissionServiceParams = {
        user_id: oThis.eventParams.user_id,
        current_admin: oThis.currentAdmin
      };

    let SendEmailForResubmissionServiceResponse = await new SendEmailForReSubmissionService(
      sendEmailForResubmissionServiceParams
    ).perform();

    if (SendEmailForResubmissionServiceResponse.isFailure()) {
      oThis._setError(SendEmailForResubmissionServiceResponse);
    }
  }

  /**
   * Update payload for slack post request.
   *
   * @param {number} actionPos
   * @param {array} newBlocks
   *
   * @returns {Promise<array>}
   * @private
   */
  async _updatedBlocks(actionPos, newBlocks) {
    const oThis = this;

    logger.log('_updateBlocks start');

    if (oThis.errMsg) {
      const formattedMsg = '`error:`' + oThis.errMsg;

      const trailingArray = newBlocks.splice(actionPos + 1);

      newBlocks[actionPos + 1] = slackConstants.addTextSection(formattedMsg);
      newBlocks = newBlocks.concat(trailingArray);
    } else {
      const txt = await oThis._textToWrite('Resubmission Email Sent');
      const newElement = {
        type: 'context',
        elements: [
          {
            type: 'mrkdwn',
            text: txt
          }
        ]
      };

      newBlocks[actionPos] = newElement;
    }

    return newBlocks;
  }
}

module.exports = SendEmailForResubmission;
