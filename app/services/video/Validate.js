const rootPrefix = '../../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

/**
 * Class to validate video by user.
 *
 * @class ValidateUploadVideoParams
 */
class ValidateUploadVideoParams extends ServiceBase {
  /**
   * Constructor to validate video by user.
   *
   * @param {object} params
   * @param {object} params.current_user
   * @param {string} [params.video_description]: Video description
   * @param {string} [params.link]: Link
   * @param {string/number} [params.per_reply_amount_in_wei]: amount in wei to write reply on video.
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
    oThis.perReplyAmountInWei = params.per_reply_amount_in_wei || 0;
    oThis.link = params.link;
  }

  /**
   * Async perform.
   *
   * @returns {Promise<result>}
   * @private
   */
  async _asyncPerform() {
    return responseHelper.successWithData({});
  }
}

module.exports = ValidateUploadVideoParams;
