const rootPrefix = '../../../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  ChannelModel = require(rootPrefix + '/app/models/mysql/channel/Channel'),
  channelConstants = require(rootPrefix + '/lib/globalConstant/channel/channels'),
  ChannelByIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/channel/ChannelByIds'),
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger');

/**
 * Class to delete channel.
 *
 * @class DeleteChannel
 */
class DeleteChannel extends ServiceBase {
  /**
   * Constructor to delete channel by admin.
   *
   * @param {object} params
   * @param {array} params.channel_id: Channel id to be deleted by admin.
   * @param {object} params.current_admin: current admin.
   *
   * @constructor
   */
  constructor(params) {
    super();

    const oThis = this;

    oThis.channelId = params.channel_id;

    oThis.channel = null;
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

    await oThis._deleteChannel();

    return responseHelper.successWithData({});
  }

  /**
   * Performs validations
   *
   * @returns {Promise<void>}
   * @private
   */
  async _validateAndSanitize() {
    const oThis = this;

    await oThis._validateChannel();
  }

  /**
   * Validate if channel is valid or not.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _validateChannel() {
    const oThis = this;

    const channelCacheResponse = await new ChannelByIdsCache({ ids: [oThis.channelId] }).fetch();
    if (channelCacheResponse.isFailure()) {
      return Promise.reject(channelCacheResponse);
    }

    oThis.channel = channelCacheResponse.data[oThis.channelId];

    if (
      !CommonValidators.validateNonEmptyObject(oThis.channel) ||
      oThis.channel.status !== channelConstants.activeStatus
    ) {
      return Promise.reject(
        responseHelper.paramValidationError({
          internal_error_identifier: 'a_s_a_c_d_vc_1',
          api_error_identifier: 'invalid_api_params',
          params_error_identifiers: ['invalid_channel_id'],
          debug_options: {
            channelId: oThis.channelId,
            channelDetails: oThis.channel
          }
        })
      );
    }
  }

  /**
   * Delete channel and flush cache
   *
   * @returns {Promise<void>}
   * @private
   */
  async _deleteChannel() {
    const oThis = this;

    const updateResponse = await new ChannelModel()
      .update({ status: channelConstants.invertedStatuses[channelConstants.deletedStatus] })
      .where({
        id: oThis.channelId,
        status: channelConstants.invertedStatuses[channelConstants.activeStatus]
      })
      .fire();

    if (!updateResponse) {
      logger.error(`Error while updating channel to ${channelConstants.deletedStatus}.`);

      return Promise.reject(
        responseHelper.paramValidationError({
          internal_error_identifier: 'a_s_a_c_d_dc_1',
          api_error_identifier: 'invalid_api_params',
          params_error_identifiers: ['invalid_channel_id'],
          debug_options: {
            channelId: oThis.channelId
          }
        })
      );
    }

    await ChannelModel.flushCache({
      ids: [oThis.channelId],
      status: channelConstants.deletedStatus,
      trendingRank: null
    });
  }
}

module.exports = DeleteChannel;
