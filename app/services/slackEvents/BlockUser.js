const rootPrefix = '../../..',
  SlackEventBase = require(rootPrefix + '/app/services/slackEvents/Base'),
  BlockUserService = require(rootPrefix + '/app/services/admin/BlockUser'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  slackConstants = require(rootPrefix + '/lib/globalConstant/slack');

/**
 * Class to process block user event.
 *
 * @class BlockUser
 */
class BlockUser extends SlackEventBase {
  /**
   * Async perform.
   *
   * @returns {Promise<result>}
   * @private
   */
  async _asyncPerform() {
    const oThis = this;

    await oThis._validateAndSanitizeParams();

    await oThis._callBlockUserService();

    await oThis._postResponseToSlack();

    return responseHelper.successWithData({});
  }

  /**
   * Call block user service.
   *
   * @returns {Promise<*>}
   * @private
   */
  async _callBlockUserService() {
    const oThis = this;

    const blockUserServiceResponseParams = {
      user_ids: [oThis.eventParams.user_id],
      current_admin: oThis.currentAdmin
    };

    const blockUserServiceResponse = await new BlockUserService(blockUserServiceResponseParams).perform();

    if (blockUserServiceResponse.isFailure()) {
      oThis._setError(blockUserServiceResponse);
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
      const txt = await oThis._textToWrite('User Deleted');
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

module.exports = BlockUser;
