const rootPrefix = '../../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  ChannelModel = require(rootPrefix + '/app/models/mysql/channel/Channel'),
  channelConstants = require(rootPrefix + '/lib/globalConstant/channel/channels'),
  ChannelByIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/channel/ChannelByIds'),
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger');

class HideChannel extends ServiceBase {
  /**
   * Constructor to hide channel by admin.
   *
   * @param {object} params
   * @param {array} params.channel_id: Channel id to be hidden by admin.
   * @param {object} params.current_admin: current admin.
   *
   * @augments ServiceBase
   *
   * @constructor
   */
  constructor(params) {
    super();

    const oThis = this;

    oThis.channelId = params.channel_ids;
    oThis.currentAdminId = params.current_admin.id;
  }

  /**
   * Async perform.
   *
   * @returns {Promise<result>}
   * @private
   */
  async _asyncPerform() {
    const oThis = this;

    await oThis._validateAndSanitize();

    await oThis._hideChannel();

    return responseHelper.successWithData({});
  }

  async _validateAndSanitize() {
    const oThis = this;

    await oThis._validateChannel();
  }

  async _validateChannel() {
    const oThis = this;

    const channelCacheResponse = await new ChannelByIdsCache({ ids: [oThis.channelId] }).fetch();
    if (channelCacheResponse.isFailure()) {
      return Promise.reject(channelCacheResponse);
    }

    const channel = channelCacheResponse.data[oThis.channelId];

    if (!CommonValidators.validateNonEmptyObject(channel) || channel.status !== channelConstants.activeStatus) {
      return Promise.reject(
        responseHelper.paramValidationError({
          internal_error_identifier: 'a_s_a_c_h_vc_1',
          api_error_identifier: 'invalid_api_params',
          params_error_identifiers: ['invalid_channel_id'],
          debug_options: {
            channelId: oThis.channelId,
            channelDetails: channel
          }
        })
      );
    }
  }

  async _hideChannel() {
    const oThis = this;

    const updateResponse = await new ChannelModel()
      .update({ status: channelConstants.invertedStatuses[channelConstants.inactiveStatus] })
      .where({ id: oThis.channelId, status: channelConstants.invertedStatuses[channelConstants.activeStatus] })
      .fire();

    if (!updateResponse) {
      logger.error(`Error while updating channel to ${channelConstants.inactiveStatus}.`);

      return Promise.reject(
        responseHelper.paramValidationError({
          internal_error_identifier: 'a_s_a_c_h_hc_1',
          api_error_identifier: 'invalid_api_params',
          params_error_identifiers: ['invalid_channel_id'],
          debug_options: {
            channelId: oThis.channelId
          }
        })
      );
    }

    await ChannelModel.flushCache({ ids: [oThis.channelId] });
  }
}

module.exports = HideChannel;
