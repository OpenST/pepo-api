const rootPrefix = '../../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  VideoDetailsByVideoIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/VideoDetailsByVideoIds'),
  videoDetailsConstants = require(rootPrefix + '/lib/globalConstant/videoDetail'),
  UserBlockedListCache = require(rootPrefix + '/lib/cacheManagement/single/UserBlockedList');

/**
 * Class to delete video by user.
 *
 * @class ValidateUploadVideoParams
 */
class ValidateUploadVideoParams extends ServiceBase {
  /**
   * Constructor to delete video by user.
   *
   * @param {object} params
   * @param {object} params.current_user
   * @param {string} [params.video_description]: Video description
   * @param {string} [params.link]: Link
   * @param {number} [params.parent_kind]: Parent kind where reply is being written.
   * @param {number} [params.parent_id]: Parent id(videos) where reply is being written.
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
    oThis.parentKind = params.parent_kind;
    oThis.parentId = params.parent_id;

    oThis.videoDetails = null;
    oThis.creatorUserId = null;
  }

  /**
   * Async perform.
   *
   * @return {Promise<void>}
   * @private
   */
  async _asyncPerform() {
    const oThis = this;

    const videoDetailsCacheRsp = await new VideoDetailsByVideoIdsCache({ videoIds: [oThis.parentId] }).fetch();

    if (videoDetailsCacheRsp.isFailure()) {
      return Promise.reject(videoDetailsCacheRsp);
    }

    let videoDetails = videoDetailsCacheRsp.data[oThis.parentId];

    if (videoDetails.status === videoDetailsConstants.deletedStatus) {
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 'a_s_v_sd_2',
          api_error_identifier: 'entity_not_found'
        })
      );
    }

    let cacheResp = await new UserBlockedListCache({ userId: oThis.currentUser.id }).fetch();
    if (cacheResp.isFailure()) {
      return Promise.reject(cacheResp);
    }
    let blockedByUserInfo = cacheResp.data[oThis.currentUser.id];
    if (
      blockedByUserInfo.hasBlocked[videoDetails.creatorUserId] ||
      blockedByUserInfo.blockedBy[videoDetails.creatorUserId]
    ) {
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 'a_s_v_sd_2',
          api_error_identifier: 'entity_not_found'
        })
      );
    }

    return responseHelper.successWithData({});
  }
}

module.exports = ValidateUploadVideoParams;
