const rootPrefix = '../../../..',
  BaseFormatter = require(rootPrefix + '/lib/formatter/Base'),
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  tagSingleFormatter = require(rootPrefix + '/lib/formatter/strategy/tag/Single'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

class TagsMapFormatter extends BaseFormatter {
  /**
   * Constructor for tags map formatter.
   *
   * @param {object} params
   * @param {object} params.tags
   *
   * @augments BaseFormatter
   *
   * @constructor
   */
  constructor(params) {
    super();

    const oThis = this;

    oThis.tags = params.tags;
  }

  /**
   * Validate the input objects.
   *
   * @returns {result}
   * @private
   */
  _validate() {
    const oThis = this;

    if (!CommonValidators.validateObject(oThis.tags)) {
      return responseHelper.error({
        internal_error_identifier: 'l_f_s_t_m_1',
        api_error_identifier: 'entity_formatting_failed',
        debug_options: { tags: oThis.tags }
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

    for (const id in oThis.tags) {
      const tagObj = oThis.tags[id],
        formattedTag = new tagSingleFormatter({ tag: tagObj }).perform();

      if (formattedTag.isFailure()) {
        return formattedTag;
      }

      finalResponse[id] = formattedTag.data;
    }

    return responseHelper.successWithData(finalResponse);
  }
}

module.exports = TagsMapFormatter;
