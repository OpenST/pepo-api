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

    await oThis._validateVideoStatus();

    await oThis._validateApprovedCreator();

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
  async _validateVideoStatus() {
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
            api_error_identifier: 'entity_not_found'
          })
        );
      }

      if (oThis.status === videoDetailsConstants.deletedStatus) {
        return Promise.reject(
          responseHelper.error({
            internal_error_identifier: 'a_s_r_v_2',
            api_error_identifier: 'entity_not_found'
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
  async _validateApprovedCreator() {
    const oThis = this,
      parentVideoCreatorId = oThis.videoDetails.creatorUserId;

    const userCacheResp = await new UserCache({ ids: [parentVideoCreatorId] }).fetch();

    if (userCacheResp.isFailure()) {
      return Promise.reject(userCacheResp);
    }

    if (!UserModel.isUserApprovedCreator(userCacheResp.data[parentVideoCreatorId])) {
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 'a_s_r_v_4',
          api_error_identifier: 'something_went_wrong'
        })
      );
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
          api_error_identifier: 'unauthorized_api_request',
          debug_options: { videoDetails: oThis.videoDetails }
        })
      );
    }
  }
}

module.exports = ValidateReplyParams;
