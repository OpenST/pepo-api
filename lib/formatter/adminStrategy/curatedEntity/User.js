const rootPrefix = '../../../..',
  BaseFormatter = require(rootPrefix + '/lib/formatter/Base'),
  adminEntityType = require(rootPrefix + '/lib/globalConstant/adminEntityType'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

/**
 * Class for user formatter.
 *
 * @class UserCuratedEntityFormatter
 */
class UserCuratedEntityFormatter extends BaseFormatter {
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

    oThis.userList = params[adminEntityType.usersCuratedEntitiesList];
  }

  /**
   * Validate the input objects.
   *
   * @returns {result}
   * @private
   */
  _validate() {
    const oThis = this;

    const userCuratedEntityKeyConfig = {};

    return oThis.validateParameters(oThis.userList, userCuratedEntityKeyConfig);
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

    return responseHelper.successWithData(oThis.userList);
  }
}

module.exports = UserCuratedEntityFormatter;
