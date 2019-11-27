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
    const oThis = this;

    const entityConfig = {
      isReplyChargeable: { isNullAllowed: false }
    };

    return oThis.validateParameters(oThis.currentUserVideoRelation, entityConfig);
  }

  /**
   * Format the input object.
   *
   * @returns {object}
   * @private
   */
  _format() {
    const oThis = this;

    return responseHelper.successWithData({
      is_reply_chargeable: oThis.currentUserVideoRelation.isReplyChargeable
    });
  }
}

module.exports = CurrentUserVideoRelationsSingleFormatter;
