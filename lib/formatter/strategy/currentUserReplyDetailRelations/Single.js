const rootPrefix = '../../../..',
  BaseFormatter = require(rootPrefix + '/lib/formatter/Base'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

/**
 * Class for current user video relations formatter.
 *
 * @class CurrentUserVideoRelationsSingleFormatter
 */
class CurrentUserReplyDetailRelationsSingleFormatter extends BaseFormatter {
  /**
   * Constructor for current user reply relations formatter.
   *
   * @param {object} params
   * @param {object} params.currentUserReplyRelation
   *
   * @augments BaseFormatter
   *
   * @constructor
   */
  constructor(params) {
    super();

    const oThis = this;

    oThis.currentUserReplyRelation = params.currentUserReplyRelation;
  }

  /**
   * Validate the input objects.
   *
   * @returns {result}
   * @private
   */
  _validate() {
    return responseHelper.successWithData({});
  }

  /**
   * Format the input object.
   *
   * @returns {object}
   * @private
   */
  _format() {
    const oThis = this;

    const hasSeen = oThis.currentUserReplyRelation.hasSeen || 0;
    const canDelete = oThis.currentUserReplyRelation.canDelete || 0;

    return responseHelper.successWithData({ has_seen: hasSeen, can_delete: canDelete });
  }
}

module.exports = CurrentUserReplyDetailRelationsSingleFormatter;
