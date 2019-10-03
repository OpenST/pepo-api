const rootPrefix = '../../../..',
  BaseFormatter = require(rootPrefix + '/lib/formatter/Base'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

/**
 * Class for get Video Details formatter.
 *
 * @class VideoDetailSingleFormatter
 */
class VideoDetailSingleFormatter extends BaseFormatter {
  /**
   * Constructor for get Video Details formatter.
   *
   * @param {object} params
   * @param {object} params.videoDetail
   *
   * @param {number} params.videoDetail.id
   * @param {object} params.videoDetail.creatorUserId
   * @param {string} params.videoDetail.videoId
   * @param {number} params.videoDetail.totalContributedBy
   * @param {number} params.videoDetail.totalAmount
   * @param {number} params.videoDetail.totalTransactions
   * @param {number} params.videoDetail.createdAt
   * @param {number} params.videoDetail.updatedAt
   *
   * @augments BaseFormatter
   *
   * @constructor
   */
  constructor(params) {
    super();

    const oThis = this;

    oThis.userAllowedAction = params.userAllowedAction;
  }

  /**
   * Validate the input objects.
   *
   * @returns {result}
   * @private
   */
  _validate() {
    const oThis = this;

    const userAllowedActionKeyConfig = {
      canEdit: { isNullAllowed: true },
      canBlock: { isNullAllowed: false },
      canUnblock: { isNullAllowed: false },
      canReport: { isNullAllowed: false }
    };

    return oThis.validateParameters(oThis.userAllowedAction, userAllowedActionKeyConfig);
  }

  /**
   * Format the input object.
   *
   * @returns {*|result|*}
   * @private
   */
  _format() {
    const oThis = this;

    return responseHelper.successWithData({
      can_edit: oThis.userAllowedAction.canEdit,
      can_block: oThis.userAllowedAction.canBlock,
      can_unblock: oThis.userAllowedAction.canUnblock,
      can_report: oThis.userAllowedAction.canReport
    });
  }
}

module.exports = VideoDetailSingleFormatter;
