const rootPrefix = '../../../..',
  BaseFormatter = require(rootPrefix + '/lib/formatter/Base'),
  adminEntityType = require(rootPrefix + '/lib/globalConstant/adminEntityType'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

/**
 * Class for channels formatter.
 *
 * @class ChannelCuratedEntityFormatter
 */
class ChannelCuratedEntityFormatter extends BaseFormatter {
  /**
   * Constructor for channels formatter.
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

    oThis.channelList = params[adminEntityType.channelsCuratedEntitiesList];
  }

  /**
   * Validate the input objects.
   *
   * @returns {result}
   * @private
   */
  _validate() {
    const oThis = this;

    const channelCuratedEntityKeyConfig = {};

    return oThis.validateParameters(oThis.channelList, channelCuratedEntityKeyConfig);
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

    return responseHelper.successWithData(oThis.channelList);
  }
}

module.exports = ChannelCuratedEntityFormatter;
