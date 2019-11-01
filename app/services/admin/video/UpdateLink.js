const rootPrefix = '../../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  VideoDetailsByVideoIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/VideoDetailsByVideoIds'),
  CommonValidator = require(rootPrefix + '/lib/validators/Common'),
  bgJob = require(rootPrefix + '/lib/rabbitMqEnqueue/bgJob'),
  bgJobConstants = require(rootPrefix + '/lib/globalConstant/bgJob'),
  videoDetailsConstants = require(rootPrefix + '/lib/globalConstant/videoDetail'),
  UserModel = require(rootPrefix + '/app/models/mysql/User'),
  UsersCache = require(rootPrefix + '/lib/cacheManagement/multi/User'),
  ActivityLogModel = require(rootPrefix + '/app/models/mysql/AdminActivityLog'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  userConstants = require(rootPrefix + '/lib/globalConstant/user'),
  adminActivityLogConstants = require(rootPrefix + '/lib/globalConstant/adminActivityLogs');

/**
 * Class to deny users as creator by admin.
 *
 * @class UpdateLink
 */
class UpdateLink extends ServiceBase {
  /**
   * Constructor to deny users as creator by admin.
   *
   * @param {object} params
   * @param {array} params.link: Link of Video by admin.
   * @param {array} params.video_id: Edit Video Link by admin.
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
   * Main performer for class.
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
   * @returns {Promise<void>}
   * @private
   */
  async _validateAndSanitizeParams() {
    const oThis = this;

    // If url is not valid, consider link as null.
    if (!oThis.link || !CommonValidator.validateGenericUrl(oThis.link)) {
      return responseHelper.paramValidationError({
        internal_error_identifier: 'a_s_a_v_ul_vasp_1',
        api_error_identifier: 'invalid_api_params',
        params_error_identifiers: ['invalid_link'],
        debug_options: { link: oThis.link }
      });
    }

    oThis.link = oThis.link.toLowerCase();
  }

  /**
   * Fetch creator user id.
   *
   * @sets oThis.videoDetails, oThis.creatorUserId
   *
   * @return {Promise<void>}
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
      return responseHelper.paramValidationError({
        internal_error_identifier: 'a_s_a_v_ul_fcui_1',
        api_error_identifier: 'invalid_api_params',
        params_error_identifiers: ['invalid_video_id'],
        debug_options: { videoDetails: oThis.videoDetail }
      });
    }

    return responseHelper.successWithData({});
  }

  /**
   * Fetch users.
   *
   * @sets oThis.user
   *
   * @returns {Promise<never>}
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

    return responseHelper.successWithData({});
  }

  /**
   * Update Link of video.
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

  /**
   * Flush cache.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _flushCache() {
    const oThis = this;

    await VideoDetailModel.flushCache({ userId: oThis.creatorUserId, videoId: videoId });
  }
}

module.exports = UpdateLink;
