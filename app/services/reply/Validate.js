const rootPrefix = '../../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  UserModel = require(rootPrefix + '/app/models/mysql/User'),
  UserCache = require(rootPrefix + '/lib/cacheManagement/multi/User'),
  UserBlockedListCache = require(rootPrefix + '/lib/cacheManagement/single/UserBlockedList'),
  VideoDetailsByVideoIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/VideoDetailsByVideoIds'),
  basicHelper = require(rootPrefix + '/helpers/basic'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  replyDetailConstants = require(rootPrefix + '/lib/globalConstant/replyDetail'),
  videoDetailsConstants = require(rootPrefix + '/lib/globalConstant/videoDetail');

/**
 * Class to validate reply params.
 *
 * @class ValidateReplyParams
 */
class ValidateReplyParams extends ServiceBase {
  /**
   * Constructor to delete video by user.
   *
   * @param {object} params
   * @param {object} params.current_user
   * @param {string} params.parent_kind: Parent kind where reply is being written.
   * @param {number} params.parent_id: Parent id(videos) where reply is being written.
   * @param {string} [params.video_description]: Video description
   * @param {string} [params.link]: Link
   *
   * @augments ServiceBase
   *
   * @constructor
   */
  constructor(params) {
    super();

    const oThis = this;

    oThis.currentUser = params.current_user;
    oThis.videoDescription = params.video_description;
    oThis.link = params.link;
    oThis.parentKind = params.parent_kind.toUpperCase();
    oThis.parentId = params.parent_id;

    oThis.videoDetails = null;
  }

  /**
   * Async perform.
   *
   * @returns {Promise<result>}
   * @private
   */
  async _asyncPerform() {
    const oThis = this;
    // Link and description validated in signature.js

    await oThis._validateParent();

    await oThis._validateParentCreator();

    await oThis._validateIfUserIsBlocked();

    return responseHelper.successWithData({});
  }

  /**
   * Validate video status.
   *
   * @sets oThis.videoDetails
   *
   * @returns {Promise<never>}
   * @private
   */
  async _validateParent() {
    const oThis = this;

    if (oThis.parentKind === replyDetailConstants.videoParentKind) {
      const videoDetailsCacheRsp = await new VideoDetailsByVideoIdsCache({ videoIds: [oThis.parentId] }).fetch();

      if (videoDetailsCacheRsp.isFailure()) {
        return Promise.reject(videoDetailsCacheRsp);
      }

      oThis.videoDetails = videoDetailsCacheRsp.data[oThis.parentId];

      if (basicHelper.isEmptyObject(oThis.videoDetails)) {
        return Promise.reject(
          responseHelper.error({
            internal_error_identifier: 'a_s_r_v_1',
            api_error_identifier: 'precondition_failed_in_reply'
          })
        );
      }

      if (oThis.videoDetails.status === videoDetailsConstants.deletedStatus) {
        return Promise.reject(
          responseHelper.error({
            internal_error_identifier: 'a_s_r_v_2',
            api_error_identifier: 'precondition_failed_in_reply'
          })
        );
      }
    } else {
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 'a_s_r_v_3',
          api_error_identifier: 'something_went_wrong'
        })
      );
    }
  }

  /**
   * Validate if parent video creator is approved or not.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _validateParentCreator() {
    const oThis = this,
      parentVideoCreatorId = oThis.videoDetails.creatorUserId;

    const userCacheResp = await new UserCache({ ids: [parentVideoCreatorId] }).fetch();

    if (userCacheResp.isFailure()) {
      return Promise.reject(userCacheResp);
    }
  }

  /**
   * Validate if user is blocked or not.
   *
   * @returns {Promise<never>}
   * @private
   */
  async _validateIfUserIsBlocked() {
    const oThis = this;

    const cacheResp = await new UserBlockedListCache({ userId: oThis.currentUser.id }).fetch();
    if (cacheResp.isFailure()) {
      return Promise.reject(cacheResp);
    }

    const blockedByUserInfo = cacheResp.data[oThis.currentUser.id];
    if (
      blockedByUserInfo.hasBlocked[oThis.videoDetails.creatorUserId] ||
      blockedByUserInfo.blockedBy[oThis.videoDetails.creatorUserId]
    ) {
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 'a_s_r_v_5',
          api_error_identifier: 'precondition_failed_in_reply',
          debug_options: { videoDetails: oThis.videoDetails }
        })
      );
    }
  }
}

module.exports = ValidateReplyParams;
