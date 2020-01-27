const rootPrefix = '../../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  TextsByIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/TextsByIds'),
  ImageByIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/ImageByIds'),
  ChannelByIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/channel/ChannelByIds'),
  ChannelStatByChannelIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/channel/ChannelStatByChannelIds'),
  ChannelUserByUserIdAndChannelIdsCache = require(rootPrefix +
    '/lib/cacheManagement/multi/channel/ChannelUserByUserIdAndChannelIds'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  channelConstants = require(rootPrefix + '/lib/globalConstant/channel/channels'),
  channelUsersConstants = require(rootPrefix + '/lib/globalConstant/channel/channelUsers');

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
    oThis.currentUser = params.current_user || {};

    oThis.channelDetails = {};
    oThis.channelStats = {};
    oThis.currentUserChannelRelations = {};

    oThis.textIds = [];
    oThis.texts = {};

    oThis.imageIds = [];
    oThis.images = {};
  }

  async _asyncPerform() {
    const oThis = this;

    await oThis._fetchAndValidateChannel();

    const promisesArray = [
      oThis._fetchChannelStats(),
      oThis._fetchUserChannelRelations(),
      oThis._fetchTexts(),
      oThis._fetchImages()
    ];

    await Promise.all(promisesArray);

    return responseHelper.successWithData(oThis._prepareResponse());
  }

  /**
   * Fetch and validate channel.
   *
   * @sets oThis.channelDetails, oThis.textIds, oThis.imageIds
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

    const channelDetails = cacheResponse.data[oThis.channelId];

    if (
      !CommonValidators.validateNonEmptyObject(channelDetails) ||
      channelDetails.status !== channelConstants.activeStatus
    ) {
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 'a_s_c_g_1',
          api_error_identifier: 'entity_not_found',
          debug_options: {
            channelId: oThis.channelId,
            channelDetails: channelDetails
          }
        })
      );
    }

    oThis.channelDetails = channelDetails;

    if (oThis.channelDetails.taglineId) {
      oThis.textIds.push(oThis.channelDetails.taglineId);
    }

    if (oThis.channelDetails.descriptionId) {
      oThis.textIds.push(oThis.channelDetails.descriptionId);
    }

    if (oThis.channelDetails.imageId) {
      oThis.imageIds.push(oThis.channelDetails.imageId);
    }
  }

  /**
   * Fetch channel stats.
   *
   * @sets oThis.channelStats
   *
   * @returns {Promise<never>}
   * @private
   */
  async _fetchChannelStats() {
    const oThis = this;

    const cacheResponse = await new ChannelStatByChannelIdsCache({ channelIds: [oThis.channelId] }).fetch();
    if (cacheResponse.isFailure()) {
      return Promise.reject(cacheResponse);
    }

    const channelStats = cacheResponse.data[oThis.channelId];

    if (!CommonValidators.validateNonEmptyObject(channelStats)) {
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 'a_s_c_g_2',
          api_error_identifier: 'entity_not_found',
          debug_options: {
            channelId: oThis.channelId,
            channelStats: channelStats
          }
        })
      );
    }

    oThis.channelStats = channelStats;
  }

  /**
   * Fetch current user channel relations.
   *
   * @sets oThis.currentUserChannelRelations
   *
   * @returns {Promise<void>}
   * @private
   */
  async _fetchUserChannelRelations() {
    const oThis = this;

    if (!oThis.currentUser.id) {
      return;
    }

    oThis.currentUserChannelRelations = { [oThis.channelId]: { is_member: 0, has_muted: 0, has_blocked: 0 } };

    const userId = oThis.currentUser.id;
    const cacheResponse = await new ChannelUserByUserIdAndChannelIdsCache({
      userId: userId,
      channelIds: [oThis.channelId]
    }).fetch();
    if (cacheResponse.isFailure()) {
      return Promise.reject(cacheResponse);
    }

    const channelUserRelation = cacheResponse.data[oThis.channelId];
    if (
      CommonValidators.validateNonEmptyObject(channelUserRelation) &&
      channelUserRelation.status === channelUsersConstants.activeStatus
    ) {
      oThis.currentUserChannelRelations[oThis.channelId].is_member = 1;
    }
  }

  /**
   * Fetch texts.
   *
   * @sets oThis.texts
   *
   * @returns {Promise<void>}
   * @private
   */
  async _fetchTexts() {
    const oThis = this;

    if (oThis.textIds.length === 0) {
      return;
    }

    const cacheResponse = await new TextsByIdsCache({ ids: [oThis.textIds] }).fetch();
    if (cacheResponse.isFailure()) {
      return Promise.reject(cacheResponse);
    }

    oThis.texts = cacheResponse.data;
  }

  /**
   * Fetch images.
   *
   * @sets oThis.images
   *
   * @returns {Promise<void>}
   * @private
   */
  async _fetchImages() {
    const oThis = this;

    if (oThis.imageIds.length === 0) {
      return;
    }

    const cacheResponse = await new ImageByIdsCache({ ids: oThis.imageIds }).fetch();
    if (cacheResponse.isFailure()) {
      return Promise.reject(cacheResponse);
    }

    oThis.images = cacheResponse.data;
  }

  /**
   * Prepare response.
   *
   * @returns {{images: *, texts: *, channel: *, channelStats: *}}
   * @private
   */
  _prepareResponse() {
    const oThis = this;

    return {
      channel: oThis.channelDetails,
      channelStats: oThis.channelStats,
      texts: oThis.texts,
      images: oThis.images
    };
  }
}

module.exports = GetChannel;
