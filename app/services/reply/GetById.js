const rootPrefix = '../../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  GetUserVideosList = require(rootPrefix + '/lib/GetUsersVideoList'),
  GetTokenService = require(rootPrefix + '/app/services/token/Get'),
  replyDetailConstants = require(rootPrefix + '/lib/globalConstant/replyDetail'),
  ReplyDetailsByIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/ReplyDetailsByIds'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  entityType = require(rootPrefix + '/lib/globalConstant/entityType');

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
   * @param {boolean} params.is_admin
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

    oThis.videoReplies = [];
    oThis.currentUserId = null;
    oThis.userRepliesMap = {};
    oThis.tokenDetails = null;
  }

  /**
   * Async perform.
   *
   * @return {Promise<void>}
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
   * @sets oThis.videoDetails, oThis.creatorUserId, oThis.currentUserId
   *
   * @return {Promise<void>}
   * @private
   */
  async _validateReplyDetailId() {
    const oThis = this;

    const replyDetailCacheResp = await new ReplyDetailsByIdsCache({ ids: [oThis.replyId] }).fetch();
    if (replyDetailCacheResp.isFailure()) {
      logger.error('Error while fetching reply detail data.');

      return Promise.reject(replyDetailCacheResp);
    }

    let replyDetail = replyDetailCacheResp.data[oThis.replyId];

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

    oThis.currentUserId = oThis.currentUser ? Number(oThis.currentUser.id) : 0;
  }

  /**
   * Fetch token details.
   *
   * @sets oThis.tokenDetails
   *
   * @return {Promise<void>}
   * @private
   */
  async _setTokenDetails() {
    const oThis = this;

    const getTokenServiceObj = new GetTokenService({});

    const tokenResp = await getTokenServiceObj.perform();

    if (tokenResp.isFailure()) {
      return Promise.reject(tokenResp);
    }

    oThis.tokenDetails = tokenResp.data.tokenDetails;
  }

  /**
   * Get videos.
   *
   * @sets oThis.userRepliesMap
   *
   * @return {Promise<result>}
   * @private
   */
  async _getReplyVideos() {
    const oThis = this;

    const userVideosObj = new GetUserVideosList({
      currentUserId: oThis.currentUserId,
      replyDetailIds: [oThis.replyId],
      isAdmin: oThis.isAdmin
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
    let rdObj = oThis.userRepliesMap.replyDetailsMap[oThis.replyId];
    oThis.videoReplies.push(oThis.userRepliesMap.fullVideosMap[rdObj.entityId]);

    return responseHelper.successWithData({});
  }

  /**
   * Prepare final response.
   *
   * @return {Promise<*|result>}
   * @private
   */
  async _prepareResponse() {
    const oThis = this;

    return responseHelper.successWithData({
      [entityType.userVideoList]: oThis.videoReplies,
      [entityType.replyDetailsMap]: oThis.userRepliesMap.replyDetailsMap,
      [entityType.videoDescriptionsMap]: oThis.userRepliesMap.videoDescriptionMap,
      [entityType.userProfilesMap]: oThis.userRepliesMap.userProfilesMap,
      [entityType.currentUserUserContributionsMap]: oThis.userRepliesMap.currentUserUserContributionsMap,
      [entityType.currentUserVideoContributionsMap]: oThis.userRepliesMap.currentUserVideoContributionsMap,
      [entityType.userProfileAllowedActions]: oThis.userRepliesMap.userProfileAllowedActions,
      [entityType.pricePointsMap]: oThis.userRepliesMap.pricePointsMap,
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
