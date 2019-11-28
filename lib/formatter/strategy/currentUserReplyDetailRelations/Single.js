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
    const oThis = this;

    const entityConfig = {
      hasSeen: { isNullAllowed: false },
      canDelete: { isNullAllowed: false },
      isShareable: { isNullAllowed: false }
    };

    return oThis.validateParameters(oThis.currentUserReplyRelation, entityConfig);
  }

  /**
   * Format the input object.
   *
   * @returns {object}
   * @private
   */
  _format() {
    const oThis = this;

    const hasSeen = oThis.currentUserReplyRelation.hasSeen;
    const canDelete = oThis.currentUserReplyRelation.canDelete;

    return responseHelper.successWithData({
      has_seen: hasSeen,
      can_delete: canDelete,
      is_shareable: oThis.currentUserReplyRelation.isShareable
    });
  }
}

module.exports = CurrentUserReplyDetailRelationsSingleFormatter;
