const rootPrefix = '../../../..',
  SlackEventBase = require(rootPrefix + '/app/services/slackEvents/Base'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  slackConstants = require(rootPrefix + '/lib/globalConstant/slack'),
  UnhideChannelService = require(rootPrefix + '/app/services/admin/channel/Unhide');

/**
 * Class to unhide channel.
 *
 * @class UnhideChannel
 */
class UnhideChannel extends SlackEventBase {
  /**
   * Async perform.
   *
   * @returns {Promise<result>}
   * @private
   */
  async _asyncPerform() {
    const oThis = this;

    await oThis._validateAndSanitizeParams();

    await oThis._unhideChannel();

    await oThis._postResponseToSlack();

    return responseHelper.successWithData({});
  }

  /**
   * Executes unhide channel service
   *
   * @returns {Promise<>}
   * @private
   */
  async _unhideChannel() {
    const oThis = this;

    const unhideChannelServiceParams = {
      channel_id: oThis.eventParams.channel_id,
      current_admin: oThis.currentAdmin
    };

    const unhideChannelServiceResponse = await new UnhideChannelService(unhideChannelServiceParams).perform();

    if (unhideChannelServiceResponse.isFailure()) {
      oThis._setError(unhideChannelServiceResponse);
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
      const txt = await oThis._textToWrite('Unhidden');
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

module.exports = UnhideChannel;
