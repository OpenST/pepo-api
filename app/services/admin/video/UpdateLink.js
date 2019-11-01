const rootPrefix = '../../../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  UrlModel = require(rootPrefix + '/app/models/mysql/Url'),
  CommonValidator = require(rootPrefix + '/lib/validators/Common'),
  UsersCache = require(rootPrefix + '/lib/cacheManagement/multi/User'),
  VideoDetailModel = require(rootPrefix + '/app/models/mysql/VideoDetail'),
  ActivityLogModel = require(rootPrefix + '/app/models/mysql/AdminActivityLog'),
  VideoDetailsByVideoIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/VideoDetailsByVideoIds'),
  urlConstants = require(rootPrefix + '/lib/globalConstant/url'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  userConstants = require(rootPrefix + '/lib/globalConstant/user'),
  videoDetailsConstants = require(rootPrefix + '/lib/globalConstant/videoDetail'),
  adminActivityLogConstants = require(rootPrefix + '/lib/globalConstant/adminActivityLogs');

/**
 * Class to update link of video.
 *
 * @class UpdateLink
 */
class UpdateLink extends ServiceBase {
  /**
   * Constructor to update link of video.
   *
   * @param {object} params
   * @param {array} params.link: Link of video by admin.
   * @param {array} params.video_id: Video id to edited.
   * @param {object} params.current_admin: current admin.
   *
   * @augments ServiceBase
   *
   * @constructor
   */
  constructor(params) {
    super();

    const oThis = this;

    oThis.videoId = params.video_id;
    oThis.link = params.link;
    oThis.currentAdmin = params.current_admin;

    oThis.currentAdminId = Number(oThis.currentAdmin.id);
    oThis.creatorUserId = null;
    oThis.videoDetail = null;
    oThis.user = null;
    oThis.linkIds = [];
  }

  /**
   * Async perform.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _asyncPerform() {
    const oThis = this;

    await oThis._validateAndSanitizeParams();

    await oThis._fetchCreatorUserId();

    await oThis._fetchUser();

    await oThis._updateLink();

    await oThis._logAdminActivity();

    return responseHelper.successWithData({});
  }

  /**
   * Validate params.
   *
   * @sets oThis.link
   *
   * @returns {Promise<void>}
   * @private
   */
  async _validateAndSanitizeParams() {
    const oThis = this;

    // If url is not valid, consider link as null.
    if (!oThis.link || !CommonValidator.validateGenericUrl(oThis.link)) {
      return Promise.reject(
        responseHelper.paramValidationError({
          internal_error_identifier: 'a_s_a_v_ul_vasp_1',
          api_error_identifier: 'invalid_api_params',
          params_error_identifiers: ['invalid_link'],
          debug_options: { link: oThis.link }
        })
      );
    }

    oThis.link = oThis.link.toLowerCase();
  }

  /**
   * Fetch creator user id.
   *
   * @sets oThis.videoDetails, oThis.creatorUserId
   *
   * @returns {Promise<void>}
   * @private
   */
  async _fetchCreatorUserId() {
    const oThis = this;

    const videoDetailsCacheResponse = await new VideoDetailsByVideoIdsCache({ videoIds: [oThis.videoId] }).fetch();
    if (videoDetailsCacheResponse.isFailure()) {
      return Promise.reject(videoDetailsCacheResponse);
    }

    oThis.videoDetail = videoDetailsCacheResponse.data[oThis.videoId];
    oThis.creatorUserId = oThis.videoDetail.creatorUserId;

    if (!oThis.creatorUserId || oThis.videoDetail.status === videoDetailsConstants.deletedStatus) {
      return Promise.reject(
        responseHelper.paramValidationError({
          internal_error_identifier: 'a_s_a_v_ul_fcui_1',
          api_error_identifier: 'invalid_api_params',
          params_error_identifiers: ['invalid_video_id'],
          debug_options: { videoDetails: oThis.videoDetail }
        })
      );
    }
  }

  /**
   * Fetch users.
   *
   * @sets oThis.user
   *
   * @returns {Promise<void>}
   * @private
   */
  async _fetchUser() {
    const oThis = this;

    const cacheRsp = await new UsersCache({ ids: [oThis.creatorUserId] }).fetch();

    if (cacheRsp.isFailure()) {
      return Promise.reject(
        responseHelper.paramValidationError({
          internal_error_identifier: 'a_s_a_v_ul_fu_1',
          api_error_identifier: 'invalid_params',
          params_error_identifiers: ['invalid_user_id'],
          debug_options: {}
        })
      );
    }

    oThis.user = cacheRsp.data[oThis.creatorUserId];

    if (oThis.user.status !== userConstants.activeStatus) {
      return Promise.reject(
        responseHelper.paramValidationError({
          internal_error_identifier: 'a_s_a_v_ul_fu_2',
          api_error_identifier: 'could_not_proceed',
          params_error_identifiers: ['user_inactive'],
          debug_options: {}
        })
      );
    }
  }

  /**
   * Update link of video.
   *
   * @sets oThis.linkIds
   *
   * @returns {Promise<void>}
   * @private
   */
  async _updateLink() {
    const oThis = this;

    const response = await new UrlModel().insertUrl({ url: oThis.link, kind: urlConstants.socialUrlKind });

    oThis.linkIds = JSON.stringify([response.insertId]);

    await new VideoDetailModel()
      .update({ link_ids: oThis.linkIds })
      .where({ id: oThis.videoDetail.id })
      .fire();

    await oThis._flushCache();
  }

  /**
   * Flush cache.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _flushCache() {
    const oThis = this;

    await VideoDetailModel.flushCache({ userId: oThis.creatorUserId, videoId: oThis.videoId });
  }

  /**
   * Log admin activity.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _logAdminActivity() {
    const oThis = this;

    await new ActivityLogModel().insertAction({
      adminId: oThis.currentAdminId,
      actionOn: oThis.creatorUserId,
      action: adminActivityLogConstants.updateUserVideoLink,
      extraData: JSON.stringify({ vid: oThis.videoId, linkIds: oThis.linkIds })
    });
  }
}

module.exports = UpdateLink;
