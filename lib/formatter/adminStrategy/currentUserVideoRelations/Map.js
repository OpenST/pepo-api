const rootPrefix = '../../../..',
  BaseFormatter = require(rootPrefix + '/lib/formatter/Base'),
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  CurrentUserVideoRelationsSingleFormatter = require(rootPrefix +
    '/lib/formatter/adminStrategy/currentUserVideoRelations/Single'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

/**
 * Class for current user video relations map formatter.
 *
 * @class AdminCurrentUserVideoRelationsMapFormatter
 */
class AdminCurrentUserVideoRelationsMapFormatter extends BaseFormatter {
  /**
   * Constructor for current user video relations map formatter.
   *
   * @param {object} params
   * @param {object} params.currentUserVideoRelationsMap
   *
   * @constructor
   */
  constructor(params) {
    super();

    const oThis = this;

    oThis.currentUserVideoRelationsMap = params.currentUserVideoRelationsMap;
  }

  /**
   * Validate the input objects.
   *
   * @returns {result}
   * @private
   */
  _validate() {
    const oThis = this;

    if (!CommonValidators.validateObject(oThis.currentUserVideoRelationsMap)) {
      return responseHelper.error({
        internal_error_identifier: 'l_f_as_cuvr_1',
        api_error_identifier: 'entity_formatting_failed',
        debug_options: {}
      });
    }

    return responseHelper.successWithData({});
  }

  /**
   * Format the input object.
   *
   * @returns {result}
   * @private
   */
  _format() {
    const oThis = this;

    const finalResponse = {};

    for (const videoId in oThis.currentUserVideoRelationsMap) {
      const currentUserVideoRelation = oThis.currentUserVideoRelationsMap[videoId],
        formattedCurrentUserVideoRelationRsp = new CurrentUserVideoRelationsSingleFormatter({
          currentUserVideoRelation: currentUserVideoRelation
        }).perform();

      if (formattedCurrentUserVideoRelationRsp.isFailure()) {
        return formattedCurrentUserVideoRelationRsp;
      }

      finalResponse[videoId] = formattedCurrentUserVideoRelationRsp.data;
    }

    return responseHelper.successWithData(finalResponse);
  }
}

module.exports = AdminCurrentUserVideoRelationsMapFormatter;
