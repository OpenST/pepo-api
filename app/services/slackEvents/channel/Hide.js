const rootPrefix = '../../../..',
  SlackEventBase = require(rootPrefix + '/app/services/slackEvents/Base'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  slackConstants = require(rootPrefix + '/lib/globalConstant/slack'),
  HideChannelService = require(rootPrefix + 'app/services/admin/channel/Hide');

/**
 * Class to hide channel.
 *
 * @class HideChannel
 */
class HideChannel extends SlackEventBase {
  /**
   * Async perform.
   *
   * @returns {Promise<result>}
   * @private
   */
  async _asyncPerform() {
    const oThis = this;

    await oThis._validateAndSanitizeParams();

    await oThis._hideChannel();

    await oThis._postResponseToSlack();

    return responseHelper.successWithData({});
  }

  async _hideChannel() {
    const oThis = this;

    const hideChannelServiceParams = {
      channel_id: oThis.eventParams.channel_id,
      current_admin: oThis.currentAdmin
    };

    const hideChannelServiceResponse = await new HideChannelService(hideChannelServiceParams).perform();

    if (hideChannelServiceResponse.isFailure()) {
      oThis._setError(hideChannelServiceResponse);
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
      const txt = await oThis._textToWrite('Hidden');
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

module.exports = HideChannel;
