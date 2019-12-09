const rootPrefix = '../../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  GetTokenService = require(rootPrefix + '/app/services/token/Get'),
  GetUserVideosList = require(rootPrefix + '/lib/GetUsersVideoList'),
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
   * @param {number} params.reply_detail_id
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

    oThis.replyDetailId = params.reply_detail_id;
    oThis.currentUser = params.current_user;
    oThis.isAdmin = params.is_admin || false;

    oThis.videoReplies = [];
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

    await oThis._getReplyVideos();

    return oThis._prepareResponse();
  }

  /**
   * Fetch creator user id.
   *
   * @sets oThis.currentUserId
   *
   * @returns {Promise<void>}
   * @private
   */
  async _validateReplyDetailId() {
    const oThis = this;

    const replyDetailCacheResp = await new ReplyDetailsByIdsCache({ ids: [oThis.replyDetailId] }).fetch();
    if (replyDetailCacheResp.isFailure()) {
      logger.error('Error while fetching reply detail data.');

      return Promise.reject(replyDetailCacheResp);
    }

    const replyDetail = replyDetailCacheResp.data[oThis.replyDetailId];

    if (!CommonValidators.validateNonEmptyObject(replyDetail)) {
      return Promise.reject(
        responseHelper.paramValidationError({
          internal_error_identifier: 'a_s_r_gbi_1',
          api_error_identifier: 'entity_not_found',
          params_error_identifiers: ['invalid_reply_detail_id'],
          debug_options: { replyDetail: replyDetail, replyDetailId: oThis.replyDetailId }
        })
      );
    }

    if (replyDetail.status === replyDetailConstants.deletedStatus) {
      return Promise.reject(
        responseHelper.paramValidationError({
          internal_error_identifier: 'a_s_r_gbi_2',
          api_error_identifier: 'entity_not_found',
          params_error_identifiers: ['reply_deleted'],
          debug_options: { replyDetailId: oThis.replyDetailId }
        })
      );
    }

    oThis.replyCreatorUserId = replyDetail.creatorUserId;
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
      replyDetailIds: [oThis.replyDetailId],
      isAdmin: oThis.isAdmin,
      fetchVideoViewDetails: 1,
      filterUserBlockedReplies: 1
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

    const rdObj = oThis.userRepliesMap.replyDetailsMap[oThis.replyDetailId];
    // If reply is not received from get videos call
    if (!CommonValidators.validateNonEmptyObject(rdObj)) {
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 'a_s_r_gbi_4',
          api_error_identifier: 'entity_not_found',
          debug_options: {}
        })
      );
    }

    oThis.videoReplies.push(oThis.userRepliesMap.fullVideosMap[rdObj.entityId]);
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
      [entityTypeConstants.videoReplyList]: oThis.videoReplies,
      [entityTypeConstants.replyDetailsMap]: oThis.userRepliesMap.replyDetailsMap,
      [entityTypeConstants.videoDescriptionsMap]: oThis.userRepliesMap.videoDescriptionMap,
      [entityTypeConstants.userProfilesMap]: oThis.userRepliesMap.userProfilesMap,
      [entityTypeConstants.currentUserUserContributionsMap]: oThis.userRepliesMap.currentUserUserContributionsMap,
      [entityTypeConstants.currentUserVideoContributionsMap]: oThis.userRepliesMap.currentUserVideoContributionsMap,
      [entityTypeConstants.currentUserReplyDetailContributionsMap]:
        oThis.userRepliesMap.currentUserReplyDetailContributionsMap,
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
