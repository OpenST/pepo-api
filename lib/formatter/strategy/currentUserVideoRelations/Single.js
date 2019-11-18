const rootPrefix = '../../../..',
  BaseFormatter = require(rootPrefix + '/lib/formatter/Base'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

class currentUserVideoRelationsSingleFormatter extends BaseFormatter {
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
    const oThis = this,
      hasSeen = oThis.currentUserVideoRelation.hasSeen || 0;

    return responseHelper.successWithData({ has_seen: hasSeen });
  }
}

module.exports = currentUserVideoRelationsSingleFormatter;
