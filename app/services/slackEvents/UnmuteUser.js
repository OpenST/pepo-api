const rootPrefix = '../../..',
  SlackEventBase = require(rootPrefix + '/app/services/slackEvents/Base'),
  UnmuteUser = require(rootPrefix + '/app/services/admin/UnMuteUser'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  slackConstants = require(rootPrefix + '/lib/globalConstant/slack');

/**
 * Class to process unmute user event.
 *
 * @class UnmuteUser
 */
class UnmuteUser extends SlackEventBase {
  /**
   * Async perform.
   *
   * @returns {Promise<result>}
   * @private
   */
  async _asyncPerform() {
    const oThis = this;

    await oThis._validateAndSanitizeParams();

    await oThis._callUnmuteUserService();

    await oThis._postResponseToSlack();

    return responseHelper.successWithData({});
  }

  /**
   * Call unmute user service.
   *
   * @returns {Promise<*>}
   * @private
   */
  async _callUnmuteUserService() {
    const oThis = this;

    const unmuteUserServiceParams = {
      user_id: oThis.eventParams.user_id,
      current_admin: oThis.currentAdmin
    };

    const unmuteUserServiceResponse = await new UnmuteUser(unmuteUserServiceParams).perform();

    if (unmuteUserServiceResponse.isFailure()) {
      oThis._setError(unmuteUserServiceResponse);
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
      const txt = await oThis._textToWrite('Unmuted');
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

module.exports = UnmuteUser;
