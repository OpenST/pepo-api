const uuidV4 = require('uuid/v4');

const rootPrefix = '../../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  UserModel = require(rootPrefix + '/app/models/mysql/User'),
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  UserMultiCache = require(rootPrefix + '/lib/cacheManagement/multi/User'),
  TextsByIdCache = require(rootPrefix + '/lib/cacheManagement/multi/TextsByIds'),
  TwitterUserByIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/TwitterUserByIds'),
  ReplyDetailsByIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/ReplyDetailsByIds'),
  TwitterUserByUserIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/TwitterUserByUserIds'),
  coreConstants = require(rootPrefix + '/config/coreConstants'),
  gotoConstants = require(rootPrefix + '/lib/globalConstant/goto'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  userConstants = require(rootPrefix + '/lib/globalConstant/user'),
  entityType = require(rootPrefix + '/lib/globalConstant/entityType'),
  replyDetailConstants = require(rootPrefix + '/lib/globalConstant/replyDetail'),
  shareEntityConstants = require(rootPrefix + '/lib/globalConstant/shareEntity');

/**
 * Class to share reply details.
 *
 * @class ShareDetails
 */
class ShareDetails extends ServiceBase {
  /**
   * Constructor to share reply details.
   *
   * @param {object} params
   * @param {number} params.reply_detail_id
   * @param {object} params.current_user
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

    oThis.isSelfVideoShare = false;
    oThis.creatorName = null;
    oThis.twitterHandle = null;
    oThis.videoDescriptionText = null;
  }

  /**
   * Async perform.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _asyncPerform() {
    const oThis = this;

    await oThis._fetchReplyDetails();

    return responseHelper.successWithData(oThis._prepareResponse());
  }

  /**
   * Fetch reply details from reply detail id.
   *
   * @sets oThis.videoDescriptionText, oThis.isSelfVideoShare, oThis.creatorName
   *
   * @returns {Promise<never>}
   * @private
   */
  async _fetchReplyDetails() {
    const oThis = this;

    const cacheResponse = await new ReplyDetailsByIdsCache({ ids: [oThis.replyDetailId] }).fetch();
    if (cacheResponse.isFailure()) {
      return Promise.reject(cacheResponse);
    }

    const replyDetails = cacheResponse.data[oThis.replyDetailId];

    if (
      !CommonValidators.validateNonEmptyObject(replyDetails) ||
      replyDetails.status === replyDetailConstants.deletedStatus ||
      !replyDetails.creatorUserId
    ) {
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 'a_s_r_sd_1',
          api_error_identifier: 'entity_not_found',
          debug_options: {
            inputReplyDetailId: oThis.replyDetailId,
            status: replyDetails.status,
            creatorUserId: replyDetails.creatorUserId
          }
        })
      );
    }

    // Fetch description if available.
    if (replyDetails.descriptionId) {
      const textCacheResp = await new TextsByIdCache({ ids: [replyDetails.descriptionId] }).fetch();
      if (textCacheResp.isFailure()) {
        return Promise.reject(textCacheResp);
      }

      const videoDescription = textCacheResp.data[replyDetails.descriptionId];

      if (videoDescription && videoDescription.text) {
        oThis.videoDescriptionText = videoDescription.text;
      }
    }

    const creatorUserId = replyDetails.creatorUserId;

    let userObj = {};

    // Video is of current user, so no need for query.
    if (oThis.currentUser && creatorUserId === oThis.currentUser.id) {
      userObj = oThis.currentUser;
      oThis.isSelfVideoShare = true;
    } else {
      const userMultiCacheRsp = await new UserMultiCache({ ids: [creatorUserId] }).fetch();

      if (userMultiCacheRsp.isFailure()) {
        return Promise.reject(userMultiCacheRsp);
      }

      userObj = userMultiCacheRsp.data[creatorUserId];
    }

    if (!userObj || userObj.status !== userConstants.activeStatus || !UserModel.isUserApprovedCreator(userObj)) {
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 'a_s_r_sd_3',
          api_error_identifier: 'entity_not_found',
          debug_options: { creatorUserId: creatorUserId }
        })
      );
    }

    oThis.creatorName = userObj.name;
    await oThis._fetchTwitterHandle(userObj.id);
  }

  /**
   * Fetch twitter handle.
   *
   * @sets oThis.twitterHandle
   *
   * @returns {Promise<*>}
   * @private
   */
  async _fetchTwitterHandle(userId) {
    const oThis = this;

    const twitterUserByUserIdsCacheResponse = await new TwitterUserByUserIdsCache({
      userIds: [userId]
    }).fetch();

    if (twitterUserByUserIdsCacheResponse.isFailure()) {
      return Promise.reject(twitterUserByUserIdsCacheResponse);
    }

    const twitterUserByUserIdsCacheData = twitterUserByUserIdsCacheResponse.data[userId];

    if (!twitterUserByUserIdsCacheData || !twitterUserByUserIdsCacheData.id) {
      return; // Don't set oThis.twitterHandle, this returns share entity without 'twitterHandle'
    }

    const twitterUserId = twitterUserByUserIdsCacheData.id;

    const twitterUserByUserIdCacheResponse = await new TwitterUserByIdsCache({ ids: [twitterUserId] }).fetch();
    if (twitterUserByUserIdCacheResponse.isFailure()) {
      return Promise.reject(twitterUserByUserIdCacheResponse);
    }

    oThis.twitterHandle = twitterUserByUserIdCacheResponse.data[twitterUserId].handle;
  }

  /**
   * Prepare final response.
   *
   * @returns {{}}
   * @private
   */
  _prepareResponse() {
    const oThis = this;

    const messageObject = shareEntityConstants.getVideoShareEntity({
      creatorName: oThis.creatorName,
      url: oThis._generateReplyShareUrl(),
      videoDescription: oThis.videoDescriptionText,
      handle: oThis.twitterHandle,
      isSelfVideoShare: oThis.isSelfVideoShare
    });

    return {
      [entityType.share]: Object.assign(
        {
          id: uuidV4(),
          kind: shareEntityConstants.replyShareKind,
          uts: Math.round(new Date() / 1000)
        },
        messageObject
      )
    };
  }

  /**
   * Generate video share url.
   *
   * @returns {string}
   * @private
   */
  _generateReplyShareUrl() {
    const oThis = this;

    return coreConstants.PA_DOMAIN + '/' + gotoConstants.replyGotoKind + '/' + oThis.replyDetailId;
  }
}

module.exports = ShareDetails;
