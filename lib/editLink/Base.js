const rootPrefix = '../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  UrlModel = require(rootPrefix + '/app/models/mysql/Url'),
  ActivityLogModel = require(rootPrefix + '/app/models/mysql/AdminActivityLog'),
  CommonValidator = require(rootPrefix + '/lib/validators/Common'),
  UsersCache = require(rootPrefix + '/lib/cacheManagement/multi/User'),
  urlConstants = require(rootPrefix + '/lib/globalConstant/url'),
  adminActivityLogConstants = require(rootPrefix + '/lib/globalConstant/adminActivityLogs'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  userConstants = require(rootPrefix + '/lib/globalConstant/user');

/**
 * Class to update link of video.
 *
 * @class EditLinkBase
 */
class EditLinkBase {
  /**
   * Constructor to update link of video.
   *
   * @param {object} params
   * @param {array} params.link: Link of video by admin.
   * @param {array} params.video_id: Video id to edited.
   * @param {Number} [params.currentAdminId]: current admin.
   *
   * @augments ServiceBase
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

    // if admin wants to set link field blank
    if (!oThis.link) {
      // delete link ids from urls table
      const linkIdToBeDeleted = oThis.existingLinkIds;
      if (oThis.existingLinkIds && oThis.existingLinkIds.length > 0) {
        await new UrlModel().deleteByIds({ ids: linkIdToBeDeleted });

        // remove association from video_details by setting linkIds empty array
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

    let user = cacheRsp.data[oThis.creatorUserId];

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
      await new ActivityLogModel().insertAction({
        adminId: oThis.currentAdminId,
        actionOn: oThis.creatorUserId,
        action: adminActivityLogConstants.updateUserVideoLink,
        extraData: JSON.stringify({ rdi: oThis.replyDetailId, vid: oThis.videoId, linkIds: oThis.linkIds })
      });
    }
  }
}

module.exports = EditLinkBase;
