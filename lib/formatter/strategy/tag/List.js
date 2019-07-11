const rootPrefix = '../../../..',
  BaseFormatter = require(rootPrefix + '/lib/formatter/Base'),
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  TagSingleFormatter = require(rootPrefix + '/lib/formatter/strategy/tag/Single'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

/**
 * Class for tag list formatter.
 *
 * @class TagListFormatter
 */
class TagListFormatter extends BaseFormatter {
  /**
   * Constructor for  users list formatter.
   *
   * @param {object} params
   * @param {array} params.tagIds
   * @param {object} params.tagsMap
   *
   * @augments BaseFormatter
   *
   * @constructor
   */
  constructor(params) {
    super();

    const oThis = this;

    oThis.tagIds = params.tagIds;
    oThis.tagsMap = params.tagsMap;
  }

  /**
   * Validate the input objects.
   *
   * @returns {result}
   * @private
   */
  _validate() {
    const oThis = this;

    if (!CommonValidators.validateArray(oThis.tagIds)) {
      return responseHelper.error({
        internal_error_identifier: 'l_f_s_t_l_1',
        api_error_identifier: 'entity_formatting_failed',
        debug_options: { array: oThis.userIds }
      });
    }

    if (!CommonValidators.validateObject(oThis.tagsMap)) {
      return responseHelper.error({
        internal_error_identifier: 'l_f_s_t_l_2',
        api_error_identifier: 'entity_formatting_failed',
        debug_options: { object: oThis.usersByIdHash }
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

    const finalResponse = [];

    for (let index = 0; index < oThis.tagIds.length; index++) {
      const tagId = oThis.tagIds[index],
        tag = oThis.tagsMap[tagId];

      const formattedTag = new TagSingleFormatter({ tag: tag }).perform();

      if (formattedTag.isFailure()) {
        return formattedTag;
      }

      finalResponse.push(formattedTag.data);
    }

    return responseHelper.successWithData(finalResponse);
  }
}

module.exports = TagListFormatter;
