const rootPrefix = '../../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  GetTokenService = require(rootPrefix + '/app/services/token/Get'),
  GetUserVideosList = require(rootPrefix + '/lib/GetUsersVideoList'),
  UserBlockedListCache = require(rootPrefix + '/lib/cacheManagement/single/UserBlockedList'),
  ReplyDetailsByIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/ReplyDetailsByIds'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  entityTypeConstants = require(rootPrefix + '/lib/globalConstant/entityType'),
  replyDetailConstants = require(rootPrefix + '/lib/globalConstant/replyDetail');

/**
 * Class to get reply by id.
 *
 * @class GetReplyById
 */
class GetReplyById extends ServiceBase {
  /**
   * Constructor to get reply by id.
   *
   * @param {object} params
   * @param {number} params.reply_id
   * @param {object} params.current_user
   * @param {boolean} [params.is_admin]
   *
   * @augments ServiceBase
   *
   * @constructor
   */
  constructor(params) {
    super();

    const oThis = this;

    oThis.replyId = params.reply_id;
    oThis.currentUser = params.current_user;
    oThis.isAdmin = params.is_admin || false;

    oThis.parentVideoId = null;
    oThis.videoReplies = [];
    oThis.blockedReplyDetailIdMap = {};
    oThis.currentUserId = null;
    oThis.userRepliesMap = {};
    oThis.tokenDetails = null;
  }

  /**
   * Async perform.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _asyncPerform() {
    const oThis = this;

    await oThis._validateReplyDetailId();

    await oThis._setTokenDetails();

    await oThis._filterRepliesByBlockedUser();

    await oThis._getReplyVideos();

    return oThis._prepareResponse();
  }

  /**
   * Fetch creator user id.
   *
   * @sets oThis.parentVideoId, oThis.currentUserId
   *
   * @returns {Promise<void>}
   * @private
   */
  async _validateReplyDetailId() {
    // TODO - replies - we need to add check for blocked relation between reply creator and current user.
    const oThis = this;

    const replyDetailCacheResp = await new ReplyDetailsByIdsCache({ ids: [oThis.replyId] }).fetch();
    if (replyDetailCacheResp.isFailure()) {
      logger.error('Error while fetching reply detail data.');

      return Promise.reject(replyDetailCacheResp);
    }

    const replyDetail = replyDetailCacheResp.data[oThis.replyId];

    if (!CommonValidators.validateNonEmptyObject(replyDetail)) {
      return Promise.reject(
        responseHelper.paramValidationError({
          internal_error_identifier: 'a_s_r_gbi_1',
          api_error_identifier: 'invalid_api_params',
          params_error_identifiers: ['invalid_reply_detail_id'],
          debug_options: { replyDetail: replyDetail, replyId: oThis.replyId }
        })
      );
    }

    if (replyDetail.status === replyDetailConstants.deletedStatus) {
      return Promise.reject(
        responseHelper.paramValidationError({
          internal_error_identifier: 'a_s_r_gbi_2',
          api_error_identifier: 'resource_not_found',
          params_error_identifiers: ['reply_deleted'],
          debug_options: { replyId: oThis.replyId }
        })
      );
    }

    oThis.parentVideoId = replyDetail.parentId;
    oThis.currentUserId = oThis.currentUser ? Number(oThis.currentUser.id) : 0;
  }

  /**
   * Fetch token details.
   *
   * @sets oThis.tokenDetails
   *
   * @returns {Promise<void>}
   * @private
   */
  async _setTokenDetails() {
    const oThis = this;

    const tokenResp = await new GetTokenService({}).perform();
    if (tokenResp.isFailure()) {
      return Promise.reject(tokenResp);
    }

    oThis.tokenDetails = tokenResp.data.tokenDetails;
  }

  /**
   * Get videos.
   *
   * @sets oThis.userRepliesMap, oThis.videoReplies
   *
   * @returns {Promise<void>}
   * @private
   */
  async _getReplyVideos() {
    const oThis = this;

    const userVideosObj = new GetUserVideosList({
      currentUserId: oThis.currentUserId,
      videoIds: [oThis.parentVideoId],
      replyDetailIds: [oThis.replyId],
      isAdmin: oThis.isAdmin,
      fetchVideoViewDetails: 1
    });

    const response = await userVideosObj.perform();

    if (response.isFailure() || !CommonValidators.validateNonEmptyObject(response.data.userProfilesMap)) {
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 'a_s_r_gbi_3',
          api_error_identifier: 'entity_not_found',
          debug_options: {}
        })
      );
    }

    oThis.userRepliesMap = response.data;

    const rdObj = oThis.userRepliesMap.replyDetailsMap[oThis.replyId];

    if (!oThis.blockedReplyDetailIdMap[rdObj.id]) {
      oThis.videoReplies.push(oThis.userRepliesMap.fullVideosMap[rdObj.entityId]);
    }
  }

  /**
   * Filter replies if user is blocked or been blocked by.
   *
   * @sets oThis.blockedReplyDetailIdMap
   *
   * * @returns {Promise<void>}
   * @private
   */
  async _filterRepliesByBlockedUser() {
    const oThis = this;

    let blockedByUserData = {};
    const cacheResp = await new UserBlockedListCache({ userId: oThis.currentUser.id }).fetch();
    if (cacheResp.isSuccess()) {
      blockedByUserData = cacheResp.data[oThis.currentUser.id];
    }

    if (Object.prototype.hasOwnProperty.call(oThis.userRepliesMap, 'replyDetailsMap')) {
      for (const replyDetailId in oThis.userRepliesMap.replyDetailsMap) {
        const replyDetail = oThis.userRepliesMap.replyDetailsMap[replyDetailId],
          replyCreatorUserId = replyDetail.creatorUserId;

        if (blockedByUserData.hasBlocked[replyCreatorUserId] || blockedByUserData.blockedBy[replyCreatorUserId]) {
          oThis.blockedReplyDetailIdMap[replyDetailId] = true;
          delete oThis.userRepliesMap.replyDetailsMap[replyDetailId];
        }
      }
    }
  }

  /**
   * Prepare final response.
   *
   * @returns {Promise<*|result>}
   * @private
   */
  async _prepareResponse() {
    const oThis = this;

    return responseHelper.successWithData({
      [entityTypeConstants.userVideoList]: oThis.videoReplies,
      [entityTypeConstants.replyDetailsMap]: oThis.userRepliesMap.replyDetailsMap,
      [entityTypeConstants.videoDescriptionsMap]: oThis.userRepliesMap.videoDescriptionMap,
      [entityTypeConstants.userProfilesMap]: oThis.userRepliesMap.userProfilesMap,
      [entityTypeConstants.currentUserUserContributionsMap]: oThis.userRepliesMap.currentUserUserContributionsMap,
      [entityTypeConstants.currentUserVideoContributionsMap]: oThis.userRepliesMap.currentUserVideoContributionsMap,
      [entityTypeConstants.currentUserReplyDetailsRelationsMap]:
        oThis.userRepliesMap.currentUserReplyDetailsRelationsMap,
      [entityTypeConstants.userProfileAllowedActions]: oThis.userRepliesMap.userProfileAllowedActions,
      [entityTypeConstants.pricePointsMap]: oThis.userRepliesMap.pricePointsMap,
      usersByIdMap: oThis.userRepliesMap.usersByIdMap,
      userStat: oThis.userRepliesMap.userStat,
      tags: oThis.userRepliesMap.tags,
      linkMap: oThis.userRepliesMap.linkMap,
      imageMap: oThis.userRepliesMap.imageMap,
      videoMap: oThis.userRepliesMap.videoMap,
      tokenUsersByUserIdMap: oThis.userRepliesMap.tokenUsersByUserIdMap,
      tokenDetails: oThis.tokenDetails
    });
  }
}

module.exports = GetReplyById;
