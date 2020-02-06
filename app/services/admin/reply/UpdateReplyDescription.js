const rootPrefix = '../../../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  EditReplyDescriptionLib = require(rootPrefix + '/lib/editDescription/Reply'),
  AdminActivityLogModel = require(rootPrefix + '/app/models/mysql/admin/AdminActivityLog'),
  ReplyDetailsByIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/ReplyDetailsByIds'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  replyDetailConstants = require(rootPrefix + '/lib/globalConstant/replyDetail'),
  adminActivityLogConstants = require(rootPrefix + '/lib/globalConstant/admin/adminActivityLogs');

/**
 * Class to update reply description.
 *
 * @class UpdateReplyDescription
 */
class UpdateReplyDescription extends ServiceBase {
  /**
   * Constructor to update reply description.
   *
   * @param {object} params
   * @param {array} params.video_description: Video description of video by admin.
   * @param {array} params.reply_detail_id: Reply id to edited.
   * @param {object} params.current_admin: current admin.
   *
   * @augments ServiceBase
   *
   * @constructor
   */
  constructor(params) {
    super();

    const oThis = this;

    oThis.replyDetailsId = params.reply_detail_id;
    oThis.videoDescription = params.video_description;
    oThis.currentAdmin = params.current_admin;

    oThis.currentAdminId = Number(oThis.currentAdmin.id);

    oThis.videoDetail = null;
    oThis.creatorUserId = null;
    oThis.existingTextId = null;

    oThis.user = null;
    oThis.isUserCreator = null;

    oThis.text = null;
  }

  /**
   * Async perform.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _asyncPerform() {
    const oThis = this;

    await oThis._editReplyDescription();

    await oThis._logAdminActivity();

    return responseHelper.successWithData({});
  }

  /**
   * Edit video description.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _editReplyDescription() {
    const oThis = this;

    const replyDetailsByIdsCacheResponse = await new ReplyDetailsByIdsCache({ ids: [oThis.replyDetailsId] }).fetch();

    if (replyDetailsByIdsCacheResponse.isFailure()) {
      return Promise.reject(replyDetailsByIdsCacheResponse);
    }

    const replyDetail = replyDetailsByIdsCacheResponse.data[oThis.replyDetailsId];

    if (!CommonValidators.validateNonEmptyObject(replyDetail)) {
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 'a_s_a_r_urd_1',
          api_error_identifier: 'entity_not_found',
          debug_options: `replyDetailId: ${oThis.replyDetailId}`
        })
      );
    }

    if (replyDetail.entityKind === replyDetailConstants.videoEntityKind) {
      oThis.videoId = replyDetail.entityId;
    } else {
      throw new Error(`Invalid entityKind-${replyDetail.entityKind}`);
    }

    const editReplyDescriptionLibResp = await new EditReplyDescriptionLib({
      replyDetailId: oThis.replyDetailsId,
      videoId: oThis.videoId,
      videoDescription: oThis.videoDescription
    }).perform();

    if (editReplyDescriptionLibResp.isFailure()) {
      return Promise.reject(editReplyDescriptionLibResp);
    }

    oThis.creatorUserId = editReplyDescriptionLibResp.data.creatorUserId;
  }

  /**
   * Log admin activity.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _logAdminActivity() {
    const oThis = this;

    await new AdminActivityLogModel().insertAction({
      adminId: oThis.currentAdminId,
      actionOn: oThis.creatorUserId,
      action: adminActivityLogConstants.updateUserReplyDescription,
      extraData: JSON.stringify({ vid: oThis.videoId, descr: oThis.videoDescription, rdi: oThis.replyDetailsId })
    });
  }
}

module.exports = UpdateReplyDescription;
