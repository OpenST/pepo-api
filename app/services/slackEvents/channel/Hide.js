const rootPrefix = '../../../..',
  SlackEventBase = require(rootPrefix + '/app/services/slackEvents/Base'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  slackConstants = require(rootPrefix + '/lib/globalConstant/slack'),
  ChannelModel = require(rootPrefix + '/app/models/mysql/channel/Channel'),
  channelConstants = require(rootPrefix + '/lib/globalConstant/channel/Channel');

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

    const channelId = oThis.eventParams.channel_id;

    const updateResponse = await new ChannelModel()
      .update({ status: channelConstants.invertedStatuses[channelConstants.inactiveStatus] })
      .where({ id: channelId, status: channelConstants.invertedStatuses[channelConstants.activeStatus] })
      .fire();

    if (!updateResponse) {
      logger.error(`Error while updating channel to ${channelConstants.inactiveStatus}.`);
      // Error handling
      // TODO set slack error
    }

    await ChannelModel.flushCache({ ids: [oThis.channelId] });
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
