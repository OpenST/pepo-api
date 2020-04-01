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
      .where({ id: channelId })
      .fire();

    if (!updateResponse) {
      logger.error(`Error while updating channel to ${channelConstants.inactiveStatus}.`);

      return Promise.reject(
        responseHelper.paramValidationError({
          internal_error_identifier: 'a_s_s_c_h_hc_1',
          api_error_identifier: 'invalid_api_params',
          params_error_identifiers: ['invalid_channel_id'],
          debug_options: { channelId: oThis.channelId }
        })
      );
    }

    await ChannelModel.flushCache({ ids: [oThis.channelId] });
  }
}

module.exports = HideChannel;
