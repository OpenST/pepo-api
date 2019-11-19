const rootPrefix = '../../../..',
  BaseFormatter = require(rootPrefix + '/lib/formatter/Base'),
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  ReplyDetailSingleFormatter = require(rootPrefix + '/lib/formatter/strategy/replyDetails/Single'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

/**
 * Class for reply details map formatter.
 *
 * @class replyDetailsMapFormatter
 */
class replyDetailsMapFormatter extends BaseFormatter {
  /**
   * Constructor for reply details map formatter.
   *
   * @param {object} params
   * @param {object} params.replyDetailsMap
   *
   * @constructor
   */
  constructor(params) {
    super();

    const oThis = this;

    oThis.replyDetailsMap = params.replyDetailsMap;
  }

  /**
   * Validate the input objects.
   *
   * @returns {result}
   * @private
   */
  _validate() {
    const oThis = this;

    if (!CommonValidators.validateObject(oThis.replyDetailsMap)) {
      return responseHelper.error({
        internal_error_identifier: 'l_f_s_rd_m_1',
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

    for (const replyDetailId in oThis.replyDetailsMap) {
      const replyDetailObj = oThis.replyDetailsMap[replyDetailId],
        formattedreplyDetailRsp = new ReplyDetailSingleFormatter({ replyDetail: replyDetailObj }).perform();

      if (formattedreplyDetailRsp.isFailure()) {
        return formattedreplyDetailRsp;
      }

      finalResponse[replyDetailId] = formattedreplyDetailRsp.data;
    }

    return responseHelper.successWithData(finalResponse);
  }
}

module.exports = replyDetailsMapFormatter;
