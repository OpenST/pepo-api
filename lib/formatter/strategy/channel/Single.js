const rootPrefix = '../../../..',
  BaseFormatter = require(rootPrefix + '/lib/formatter/Base'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

/**
 * Class for channel single formatter.
 *
 * @class ChannelSingleFormatter
 */
class ChannelSingleFormatter extends BaseFormatter {
  /**
   * Constructor for channel single formatter.
   *
   * @param {object} params
   * @param {object} params.channel
   * @param {number} params.channel.id
   * @param {string} params.channel.name
   * @param {number} params.channel.liveMeetingId
   * @param {string} params.channel.permalink
   * @param {string} params.channel.status
   * @param {number} params.channel.updatedAt
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
      liveMeetingId: { isNullAllowed: true },
      permalink: { isNullAllowed: false },
      status: { isNullAllowed: false },
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
      live_meeting_id: oThis.channel.liveMeetingId,
      permalink: oThis.channel.permalink,
      status: oThis.channel.status,
      uts: oThis.channel.updatedAt
    });
  }
}

module.exports = ChannelSingleFormatter;
