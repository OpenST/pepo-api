const rootPrefix = '../../../..',
  BaseFormatter = require(rootPrefix + '/lib/formatter/Base'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

class ChannelSingleFormatter extends BaseFormatter {
  /**
   * Constructor for ChannelSingleFormatter.
   *
   * @param {object} params
   * @param {object} params.channel
   *
   * @augments BaseFormatter
   *
   * @constructor
   */
  constructor(params) {
    super();

    const oThis = this;

    oThis.channel = params.channel;
  }

  /**
   * Validate the input objects.
   *
   * @returns {result}
   * @private
   */
  _validate() {
    const oThis = this;

    const channelKeyConfig = {
      id: { isNullAllowed: false },
      name: { isNullAllowed: false },
      status: { isNullAllowed: false },
      descriptionId: { isNullAllowed: true },
      imageId: { isNullAllowed: true },
      createdAt: { isNullAllowed: false },
      updatedAt: { isNullAllowed: false }
    };

    return oThis.validateParameters(oThis.channel, channelKeyConfig);
  }

  /**
   * Format the input object.
   *
   * @returns {object|result}
   */
  _format() {
    const oThis = this;

    return responseHelper.successWithData({
      id: oThis.channel.id,
      name: oThis.channel.name,
      status: oThis.channel.status,
      description_id: oThis.channel.descriptionId,
      image_id: oThis.channel.imageId,
      uts: oThis.channel.updatedAt
    });
  }
}

module.exports = ChannelSingleFormatter;
