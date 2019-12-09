const rootPrefix = '../../../..',
  BaseFormatter = require(rootPrefix + '/lib/formatter/Base'),
  adminEntityType = require(rootPrefix + '/lib/globalConstant/adminEntityType'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

/**
 * Class for tags formatter.
 *
 * @class TagCuratedEntityFormatter
 */
class TagCuratedEntityFormatter extends BaseFormatter {
  /**
   * Constructor for admin formatter.
   *
   * @param {object} params
   *
   * @augments BaseFormatter
   *
   * @constructor
   */
  constructor(params) {
    super();

    const oThis = this;

    oThis.tagList = params[adminEntityType.tagsCuratedEntitiesList];
  }

  /**
   * Validate the input objects.
   *
   * @returns {result}
   * @private
   */
  _validate() {
    const oThis = this;

    const tagCuratedEntityKeyConfig = {};

    return oThis.validateParameters(oThis.tagList, tagCuratedEntityKeyConfig);
  }

  /**
   * Format the input object.
   *
   * @returns {*|result}
   * @private
   */
  _format() {
    const oThis = this;

    const finalResponse = [];

    return responseHelper.successWithData(oThis.tagList);
  }
}

module.exports = TagCuratedEntityFormatter;
