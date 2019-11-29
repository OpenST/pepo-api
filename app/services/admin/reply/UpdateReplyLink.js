const rootPrefix = '../../../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  EditReplyVideoLink = require(rootPrefix + '/lib/editLink/Reply');

/**
 * Class to update link of video.
 *
 * @class UpdateReplyLink
 */
class UpdateReplyLink extends ServiceBase {
  /**
   * Constructor to update link of video.
   *
   * @param {object} params
   * @param {array} params.link: Link of video by admin.
   * @param {array} params.reply_detail_id: Reply_detail_id to edited.
   * @param {object} params.current_admin: current admin.
   *
   * @augments ServiceBase
   *
   * @constructor
   */
  constructor(params) {
    super();

    const oThis = this;

    oThis.replyDetailId = params.reply_detail_id;
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

    await new EditReplyVideoLink({
      replyDetailId: oThis.replyDetailId,
      link: oThis.link,
      currentAdminId: oThis.currentAdminId
    }).perform();

    return responseHelper.successWithData({});
  }
}

module.exports = UpdateReplyLink;
