const rootPrefix = '../../../..',
  BaseFormatter = require(rootPrefix + '/lib/formatter/Base'),
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  CurrentUserReplyDetailRelationsSingleFormatter = require(rootPrefix +
    '/lib/formatter/strategy/currentUserReplyDetailRelations/Single'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

/**
 * Class for current user reply relations map formatter.
 *
 * @class CurrentUserReplyDetailRelationsMapFormatter
 */
class CurrentUserReplyDetailRelationsMapFormatter extends BaseFormatter {
  /**
   * Constructor for current user reply relations map formatter.
   *
   * @param {object} params
   * @param {object} params.currentUserReplyDetailsRelationsMap
   *
   * @constructor
   */
  constructor(params) {
    super();

    const oThis = this;

    oThis.currentUserReplyRelationsMap = params.currentUserReplyDetailsRelationsMap;
  }

  /**
   * Validate the input objects.
   *
   * @returns {result}
   * @private
   */
  _validate() {
    const oThis = this;

    if (!CommonValidators.validateObject(oThis.currentUserReplyRelationsMap)) {
      return responseHelper.error({
        internal_error_identifier: 'l_f_s_curd_1',
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

    for (const replyDetailId in oThis.currentUserReplyRelationsMap) {
      const currentUserReplyRelation = oThis.currentUserReplyRelationsMap[videoId],
        formattedRelationRsp = new CurrentUserReplyDetailRelationsSingleFormatter({
          currentUserReplyRelation: currentUserReplyRelation
        }).perform();

      if (formattedRelationRsp.isFailure()) {
        return formattedRelationRsp;
      }

      finalResponse[replyDetailId] = formattedRelationRsp.data;
    }

    return responseHelper.successWithData(finalResponse);
  }
}

module.exports = CurrentUserReplyDetailRelationsMapFormatter;
