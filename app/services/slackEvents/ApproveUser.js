const rootPrefix = '../../..',
  SlackEventBase = require(rootPrefix + '/app/services/slackEvents/Base'),
  ApproveUsersAsCreatorService = require(rootPrefix + '/app/services/admin/ApproveUsersAsCreator'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  slackConstants = require(rootPrefix + '/lib/globalConstant/slack'),
  pixelConstants = require(rootPrefix + '/lib/globalConstant/pixel');

/**
 * Class to process approve user event.
 *
 * @class ApproveUser
 */
class ApproveUser extends SlackEventBase {
  /**
   * Async perform.
   *
   * @returns {Promise<result>}
   * @private
   */
  async _asyncPerform() {
    const oThis = this;

    await oThis._validateAndSanitizeParams();

    await oThis._callApproveUserService();

    await oThis._postResponseToSlack();

    return responseHelper.successWithData({});
  }

  /**
   * Call approve user service.
   *
   * @returns {Promise<*>}
   * @private
   */
  async _callApproveUserService() {
    const oThis = this;

    const approveUserServiceParams = {
      user_ids: [oThis.eventParams.user_id],
      current_admin: oThis.currentAdmin
    };

    const approveUserServiceResponse = await new ApproveUsersAsCreatorService(approveUserServiceParams).perform();

    if (approveUserServiceResponse.isFailure()) {
      oThis._setError(approveUserServiceResponse);
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
      const txt = await oThis._textToWrite('Approved');
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

module.exports = ApproveUser;
