const rootPrefix = '../../../..',
  SlackEventBase = require(rootPrefix + '/app/services/slackEvents/Base'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  slackConstants = require(rootPrefix + '/lib/globalConstant/slack'),
  DeleteChannelService = require(rootPrefix + 'app/services/admin/channel/Delete');

/**
 * Class to delete channel.
 *
 * @class DeleteChannel
 */
class DeleteChannel extends SlackEventBase {
  /**
   * Async perform.
   *
   * @returns {Promise<result>}
   * @private
   */
  async _asyncPerform() {
    const oThis = this;

    await oThis._validateAndSanitizeParams();

    await oThis._deleteChannel();

    await oThis._postResponseToSlack();

    return responseHelper.successWithData({});
  }

  /**
   * Executes deleted channel service
   *
   * @returns {Promise<>}
   * @private
   */
  async _deleteChannel() {
    const oThis = this;

    const deletedChannelServiceParams = {
      channel_id: oThis.eventParams.channel_id,
      current_admin: oThis.currentAdmin
    };

    const deletedChannelServiceResponse = await new DeleteChannelService(deletedChannelServiceParams).perform();

    if (deletedChannelServiceResponse.isFailure()) {
      oThis._setError(deletedChannelServiceResponse);
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
      const txt = await oThis._textToWrite('Deleted');
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

module.exports = DeleteChannel;
