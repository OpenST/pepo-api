const rootPrefix = '../..',
  UrlModel = require(rootPrefix + '/app/models/mysql/Url'),
  CommonValidator = require(rootPrefix + '/lib/validators/Common'),
  UsersCache = require(rootPrefix + '/lib/cacheManagement/multi/User'),
  AdminActivityLogModel = require(rootPrefix + '/app/models/mysql/admin/AdminActivityLog'),
  urlConstants = require(rootPrefix + '/lib/globalConstant/url'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  userConstants = require(rootPrefix + '/lib/globalConstant/user'),
  adminActivityLogConstants = require(rootPrefix + '/lib/globalConstant/admin/adminActivityLogs');

/**
 * Base class to update link of video or reply.
 *
 * @class EditLinkBase
 */
class EditLinkBase {
  /**
   * Constructor to update link of video or reply.
   *
   * @param {object} params
   * @param {array} params.link: Link of video by admin.
   * @param {number} [params.currentAdminId]: current admin.
   *
   * @constructor
   */
  constructor(params) {
    const oThis = this;

    oThis.link = params.link;
    oThis.currentAdminId = params.currentAdminId;

    oThis.creatorUserId = null;
    oThis.existingLinkIds = [];
  }

  /**
   * Async perform.
   *
   * @returns {Promise<void>}
   * @private
   */
  async perform() {
    const oThis = this;

    await oThis._validateAndSanitizeLink();

    await oThis._fetchCreatorUserId();

    // If admin wants to set link field blank.
    if (!oThis.link) {
      // Delete link ids from urls table.
      const linkIdToBeDeleted = oThis.existingLinkIds;
      if (oThis.existingLinkIds && oThis.existingLinkIds.length > 0) {
        await new UrlModel().deleteByIds({ ids: linkIdToBeDeleted });

        // Remove association from video_details by setting linkIds empty array.
        await oThis._updateLinkIdsInEntities([]);
      }

      return responseHelper.successWithData({});
    }

    await oThis._fetchUser();

    await oThis._updateLink();

    await oThis._logAdminActivity();

    return responseHelper.successWithData({});
  }

  /**
   * Validate link from params.
   *
   * @sets oThis.link
   *
   * @returns {Promise<void>}
   * @private
   */
  async _validateAndSanitizeLink() {
    const oThis = this;

    // If url is not valid, consider link as null.
    if (!CommonValidator.validateGenericUrl(oThis.link)) {
      oThis.link = null;
    }
  }

  /**
   * Fetch users.
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
          internal_error_identifier: 'l_el_b_1',
          api_error_identifier: 'invalid_params',
          params_error_identifiers: ['invalid_user_id'],
          debug_options: {}
        })
      );
    }

    const user = cacheRsp.data[oThis.creatorUserId];

    if (user.status !== userConstants.activeStatus) {
      return Promise.reject(
        responseHelper.paramValidationError({
          internal_error_identifier: 'l_el_b_2',
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

    oThis.linkIds = [response.insertId];

    await oThis._updateLinkIdsInEntities(oThis.linkIds);
  }

  /**
   * Log admin activity.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _logAdminActivity() {
    const oThis = this;

    if (oThis.currentAdminId) {
      await new AdminActivityLogModel().insertAction({
        adminId: oThis.currentAdminId,
        actionOn: oThis.creatorUserId,
        action: adminActivityLogConstants.updateUserVideoLink,
        extraData: JSON.stringify({ rdi: oThis.replyDetailId, vid: oThis.videoId, linkIds: oThis.linkIds })
      });
    }
  }
}

module.exports = EditLinkBase;
