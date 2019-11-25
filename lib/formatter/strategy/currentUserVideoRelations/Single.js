const rootPrefix = '../../../..',
  BaseFormatter = require(rootPrefix + '/lib/formatter/Base'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

/**
 * Class for current user video relations formatter.
 *
 * @class CurrentUserVideoRelationsSingleFormatter
 */
class CurrentUserVideoRelationsSingleFormatter extends BaseFormatter {
  /**
   * Constructor for current user video relations formatter.
   *
   * @param {object} params
   * @param {object} params.currentUserVideoRelation
   *
   * @augments BaseFormatter
   *
   * @constructor
   */
  constructor(params) {
    super();

    const oThis = this;

    oThis.currentUserVideoRelation = params.currentUserVideoRelation;
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

    const hasSeen = oThis.currentUserVideoRelation.hasSeen || 0;
    const canDelete = oThis.currentUserVideoRelation.canDelete || 0;

    return responseHelper.successWithData({ has_seen: hasSeen, can_delete: canDelete });
  }
}

module.exports = CurrentUserVideoRelationsSingleFormatter;
