const rootPrefix = '../../../..',
  BaseFormatter = require(rootPrefix + '/lib/formatter/Base'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

/**
 * Class for unseen replies formatter.
 *
 * @class UserFormatter
 */
// TODO bubble - file not required
class UnseenRepliesFormatter extends BaseFormatter {
  /**
   * Constructor for unseen replies formatter.
   *
   * @param {object} params
   * @param {integer} params.creatorId
   * @param {integer} params.replyDetailsId
   * @param {integer} params.replyVideoId
   *
   * @augments BaseFormatter
   *
   * @constructor
   */
  constructor(params) {
    super();

    const oThis = this;

    oThis.unseenRepliesObject = params;

    oThis.creatorUserId = oThis.unseenRepliesObject.creatorId;
    oThis.replyDetailsId = oThis.unseenRepliesObject.replyDetailsId;
    oThis.replyVideoId = oThis.unseenRepliesObject.replyVideoId;
  }

  /**
   * Validate the input objects.
   *
   * @returns {result}
   * @private
   */
  _validate() {
    const oThis = this;

    const userKeyConfig = {
      creatorId: { isNullAllowed: false },
      replyDetailsId: { isNullAllowed: false },
      replyVideoId: { isNullAllowed: false }
    };

    const unseenRepliesValidationResponse = oThis.validateParameters(oThis.unseenRepliesObject, userKeyConfig);

    if (unseenRepliesValidationResponse.isFailure()) {
      logger.error('Unseen replies validation failed in formatter-----');
      return unseenRepliesValidationResponse;
    }

    return responseHelper.successWithData({});
  }

  /**
   * Format the input object.
   *
   * @returns {*|result}
   * @private
   */
  _format() {
    const oThis = this;

    return responseHelper.successWithData({
      reply_detail_id: Number(oThis.replyDetailsId),
      user_id: Number(oThis.creatorUserId)
    });
  }
}

module.exports = UnseenRepliesFormatter;
