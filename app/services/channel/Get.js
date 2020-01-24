const rootPrefix = '../../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  ChannelByIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/ChannelByIds'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  channelConstants = require(rootPrefix + '/lib/globalConstant/channel/channels');

/**
 * Class to get channel details.
 *
 * @class GetChannel
 */
class GetChannel extends ServiceBase {
  /**
   * Constructor to get channel details.
   *
   * @param {object} params
   * @param {number} params.channel_id
   * @param {object} params.current_user
   *
   * @augments ServiceBase
   *
   * @constructor
   */
  constructor(params) {
    super();

    const oThis = this;

    oThis.channelId = params.channel_id;
    oThis.currentUser = params.current_user;
  }

  async _asyncPerform() {
    const oThis = this;

    await oThis._fetchAndValidateChannel();

    const promisesArray = [oThis._fetchChannelStats(), oThis._fetchUserChannelRelations()];

    await Promise.all(promisesArray);
  }

  /**
   * Fetch and validate channel.
   *
   * @sets oThis.channelDetails
   *
   * @returns {Promise<never>}
   * @private
   */
  async _fetchAndValidateChannel() {
    const oThis = this;

    const cacheResponse = await new ChannelByIdsCache({ ids: [oThis.channelId] }).fetch();
    if (cacheResponse.isFailure()) {
      return Promise.reject(cacheResponse);
    }

    oThis.channelDetails = cacheResponse.data[oThis.channelId];

    if (
      !CommonValidators.validateNonEmptyObject(oThis.channelDetails) ||
      oThis.channelDetails.status !== channelConstants.activeStatus
    ) {
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 'a_s_c_g_1',
          api_error_identifier: 'entity_not_found',
          debug_options: {
            channelId: oThis.channelId,
            channelDetails: oThis.channelDetails
          }
        })
      );
    }
  }

  async _fetchChannelStats() {
    const oThis = this;
  }
}

module.exports = GetChannel;
