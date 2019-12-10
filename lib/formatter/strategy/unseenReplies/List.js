const rootPrefix = '../../../..',
  BaseFormatter = require(rootPrefix + '/lib/formatter/Base'),
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  UnseenRepliesSingleFormatter = require(rootPrefix + '/lib/formatter/strategy/unseenReplies/Single'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  entityTypeConstants = require(rootPrefix + '/lib/globalConstant/entityType');

/**
 * Class for unseen replies list formatter.
 *
 * @class UnseenRepliesFormatter
 */
class UnseenRepliesFormatter extends BaseFormatter {
  /**
   * Constructor for  unseen replies list formatter.
   *
   * @param {object} params
   * @param {object} params.unseenReplies
   *
   * @augments BaseFormatter
   *
   * @constructor
   */
  constructor(params) {
    super();

    const oThis = this;

    oThis.unseenRepliesByVideoIdMap = params[entityTypeConstants.unseenReplies];
  }

  /**
   * Validate the input objects.
   *
   * @returns {result}
   * @private
   */
  _validate() {
    const oThis = this;

    if (!CommonValidators.validateObject(oThis.unseenRepliesByVideoIdMap)) {
      return responseHelper.error({
        internal_error_identifier: 'l_f_s_ur_1',
        api_error_identifier: 'entity_formatting_failed',
        debug_options: { unseenRepliesByVideoIdMap: oThis.unseenRepliesByVideoIdMap }
      });
    }

    for (let videoId in oThis.unseenRepliesByVideoIdMap) {
      if (!CommonValidators.validateObject(oThis.unseenRepliesByVideoIdMap[videoId])) {
        return responseHelper.error({
          internal_error_identifier: 'l_f_s_ur_2',
          api_error_identifier: 'entity_formatting_failed',
          debug_options: { unseenReplies: oThis.unseenRepliesByVideoIdMap[videoId] }
        });
      }

      if (!CommonValidators.validateArray(oThis.unseenRepliesByVideoIdMap[videoId].unseen)) {
        return responseHelper.error({
          internal_error_identifier: 'l_f_s_ur_3',
          api_error_identifier: 'entity_formatting_failed',
          debug_options: { unseenRepliesArray: oThis.unseenRepliesByVideoIdMap[videoId].unseen }
        });
      }
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

    for (let videoId in oThis.unseenRepliesByVideoIdMap) {
      finalResponse[videoId] = {
        id: videoId,
        uts: Math.floor(new Date().getTime() / 1000),
        unseen: []
      };
      const unseenRepliesArray = oThis.unseenRepliesByVideoIdMap[videoId].unseen;

      for (let index = 0; index < unseenRepliesArray.length; index++) {
        const unseenRepliesSingleFormatterRsp = new UnseenRepliesSingleFormatter(unseenRepliesArray[index]).perform();
        if (unseenRepliesSingleFormatterRsp.isFailure()) {
          return unseenRepliesSingleFormatterRsp;
        }

        finalResponse[videoId].unseen.push(unseenRepliesSingleFormatterRsp.data);
      }
    }

    return responseHelper.successWithData(finalResponse);
  }
}

module.exports = UnseenRepliesFormatter;
