const rootPrefix = '../../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  ChannelByIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/channel/ChannelByIds'),
  channelUsersConstants = require(rootPrefix + '/lib/globalConstant/channel/channelUsers'),
  ChannelIdsByUserCache = require(rootPrefix + '/lib/cacheManagement/multi/channel/ChannelIdsByUser'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  entityTypeConstants = require(rootPrefix + '/lib/globalConstant/entityType');

/**
 * Class to get current user managed communities details.
 *
 * @class CurrentUserManagedCommunities
 */
class CurrentUserManagedCommunities extends ServiceBase {
  /**
   * Constructor to get current user managed communities details.
   *
   * @param params
   * @param {string} params.user_id: user id
   * @param {object} params.current_user: current user
   * @param {string} params.current_user.id: current user id
   *
   * @augments ServiceBase
   *
   * @constructor
   */
  constructor(params) {
    super();

    const oThis = this;

    oThis.userId = params.user_id;
    oThis.currentUserId = params.current_user.id;

    oThis.managedChannelIds = [];
    oThis.channelsMap = {};
  }

  /**
   * Async perform.
   *
   * @return {Promise<void>}
   */
  async _asyncPerform() {
    const oThis = this;

    oThis._validateAndSanitize();

    await oThis._fetchManagedChannelIds();

    await oThis._fetchChannelDetails();

    return responseHelper.successWithData(oThis._formattedResponse());
  }

  /**
   * Validate and sanitize params.
   *
   * @returns {*|result}
   * @private
   */
  _validateAndSanitize() {
    const oThis = this;

    if (oThis.userId !== oThis.currentUserId) {
      return responseHelper.paramValidationError({
        internal_error_identifier: 'a_s_u_mc_3',
        api_error_identifier: 'invalid_api_params',
        params_error_identifiers: ['invalid_user_id'],
        debug_options: {
          userId: oThis.userId,
          currentUserId: oThis.currentUserId
        }
      });
    }
  }

  /**
   * Fetch managed channel ids.
   *
   * @sets oThis.managedChannelIds
   *
   * @returns {Promise<never>}
   * @private
   */
  async _fetchManagedChannelIds() {
    const oThis = this;

    const channelIdsByUserIdsCacheResponse = await new ChannelIdsByUserCache({ userIds: [oThis.userId] }).fetch();

    if (channelIdsByUserIdsCacheResponse.isFailure()) {
      return Promise.reject(channelIdsByUserIdsCacheResponse);
    }

    oThis.managedChannelIds = channelIdsByUserIdsCacheResponse.data[oThis.userId][channelUsersConstants.adminRole];
  }

  /**
   * Fetch channel details for channel ids.
   *
   * @returns {Promise<never>}
   * @private
   */
  async _fetchChannelDetails() {
    const oThis = this;

    if (!oThis.managedChannelIds || oThis.managedChannelIds.length === 0) {
      return;
    }

    const cacheResponse = await new ChannelByIdsCache({ ids: oThis.managedChannelIds }).fetch();
    if (cacheResponse.isFailure()) {
      return Promise.reject(cacheResponse);
    }

    oThis.channelsMap = cacheResponse.data;
  }

  /**
   * This function returns formatted response.
   *
   * @returns {object}
   * @private
   */
  _formattedResponse() {
    const oThis = this;

    return {
      [entityTypeConstants.channelsMap]: oThis.channelsMap
    };
  }
}

module.exports = CurrentUserManagedCommunities;
