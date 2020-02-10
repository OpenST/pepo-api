const rootPrefix = '../../..',
  FeedBase = require(rootPrefix + '/app/services/feed/Base'),
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  FeedByIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/FeedByIds'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

/**
 * Class for feed details by id.
 *
 * @class FeedById
 */
class FeedById extends FeedBase {
  /**
   * Constructor for feed details by id.
   *
   * @param {object} params
   * @param {object} params.current_user
   * @param {number/string} params.feed_id
   *
   * @augments FeedBase
   *
   * @constructor
   */
  constructor(params) {
    super(params);

    const oThis = this;

    oThis.feedId = params.feed_id;
  }

  /**
   * Validate and sanitize.
   *
   * @sets oThis.currentUserId
   *
   * @returns {Promise<*|result>}
   * @private
   */
  async _validateAndSanitizeParams() {
    const oThis = this;

    if (oThis.currentUser) {
      oThis.currentUserId = Number(oThis.currentUser.id);
    } else {
      oThis.currentUserId = 0;
    }

    return responseHelper.successWithData({});
  }

  /**
   * Set feed ids.
   *
   * @sets oThis.feedIds, oThis.feedsMap
   *
   * @returns {Promise<*>}
   * @private
   */
  async _setFeedIds() {
    const oThis = this;

    oThis.feedIds = [oThis.feedId];

    const feedByIdsCacheResponse = await new FeedByIdsCache({ ids: oThis.feedIds }).fetch();
    if (feedByIdsCacheResponse.isFailure()) {
      return Promise.reject(feedByIdsCacheResponse);
    }

    oThis.feedsMap = feedByIdsCacheResponse.data;

    if (!CommonValidators.validateNonEmptyObject(oThis.feedsMap[oThis.feedId])) {
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 'a_s_f_bi_1',
          api_error_identifier: 'entity_not_found',
          debug_options: { feedId: oThis.feedId }
        })
      );
    }
  }

  /**
   * Filter out feeds of inactive users.
   *
   * @returns {Promise<never>}
   * @private
   */
  async _filterInactiveUserFeeds() {
    const oThis = this;

    await super._filterInactiveUserFeeds();

    if (oThis.feeds.length <= 0) {
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 'a_s_f_bi_2',
          api_error_identifier: 'entity_not_found',
          debug_options: {}
        })
      );
    }
  }

  /**
   * Prepare response.
   *
   * @returns {*|result}
   * @private
   */
  async _prepareResponse() {
    const oThis = this;

    return responseHelper.successWithData({
      feed: oThis.feeds[0], // For this service, feeds array will contain only one element.
      userProfilesMap: oThis.profileResponse.userProfilesMap,
      userProfileAllowedActions: oThis.profileResponse.userProfileAllowedActions,
      usersByIdMap: oThis.profileResponse.usersByIdMap,
      tokenUsersByUserIdMap: oThis.profileResponse.tokenUsersByUserIdMap,
      imageMap: oThis.profileResponse.imageMap,
      videoMap: oThis.profileResponse.videoMap,
      linkMap: oThis.profileResponse.linkMap,
      tags: oThis.profileResponse.tags,
      userStat: oThis.profileResponse.userStat,
      videoDetailsMap: oThis.profileResponse.videoDetailsMap,
      channelsMap: oThis.profileResponse.channelsMap,
      videoDescriptionsMap: oThis.profileResponse.videoDescriptionMap,
      currentUserUserContributionsMap: oThis.profileResponse.currentUserUserContributionsMap,
      currentUserVideoContributionsMap: oThis.profileResponse.currentUserVideoContributionsMap,
      currentUserVideoRelationsMap: oThis.profileResponse.currentUserVideoRelationsMap,
      pricePointsMap: oThis.profileResponse.pricePointsMap,
      tokenDetails: oThis.tokenDetails
    });
  }

  /**
   * Mark user device details.
   *
   * @returns {Promise<*>}
   * @private
   */
  async _markUserDeviceDetails() {
    // Do nothing.
  }
}

module.exports = FeedById;
