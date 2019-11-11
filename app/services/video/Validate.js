const rootPrefix = '../../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

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
   * @param {number} [params.per_reply_amount_in_wei]: amount in wei to write reply on video.
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
    oThis.perReplyAmountInWei = params.per_reply_amount_in_wei;
    oThis.link = params.link;

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
    return responseHelper.successWithData({});
  }
}

module.exports = ValidateUploadVideoParams;
