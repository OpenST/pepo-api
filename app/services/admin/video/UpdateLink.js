const rootPrefix = '../../../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  EditVideoLink = require(rootPrefix + '/lib/editLink/Video');

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
  }

  /**
   * Async perform.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _asyncPerform() {
    const oThis = this;

    await new EditVideoLink({
      videoId: oThis.videoId,
      link: oThis.link,
      currentAdminId: oThis.currentAdminId
    }).perform();

    await oThis._logAdminActivity();

    return responseHelper.successWithData({});
  }
}

module.exports = UpdateLink;
