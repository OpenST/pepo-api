const rootPrefix = '../../../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  EditVideoDescriptionLib = require(rootPrefix + '/lib/editDescription/Video'),
  AdminActivityLogModel = require(rootPrefix + '/app/models/mysql/admin/AdminActivityLog'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  adminActivityLogConstants = require(rootPrefix + '/lib/globalConstant/admin/adminActivityLogs');

/**
 * Class to update video description.
 *
 * @class UpdateVideoDescription
 */
class UpdateVideoDescription extends ServiceBase {
  /**
   * Constructor to update video description.
   *
   * @param {object} params
   * @param {array} params.video_description: Video description of video by admin.
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

    await oThis._editVideoDescription();

    await oThis._logAdminActivity();

    return responseHelper.successWithData({});
  }

  /**
   * Edit video description.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _editVideoDescription() {
    const oThis = this;

    const editVideoDescriptionResp = await new EditVideoDescriptionLib({
      videoId: oThis.videoId,
      videoDescription: oThis.videoDescription
    }).perform();

    if (editVideoDescriptionResp.isFailure()) {
      return Promise.reject(editVideoDescriptionResp);
    }

    oThis.creatorUserId = editVideoDescriptionResp.data.creatorUserId;
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
      action: adminActivityLogConstants.updateUserVideoDescription,
      extraData: JSON.stringify({ vid: oThis.videoId, descr: oThis.videoDescription })
    });
  }
}

module.exports = UpdateVideoDescription;
