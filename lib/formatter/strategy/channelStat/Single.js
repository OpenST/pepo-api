const rootPrefix = '../../../..',
  BaseFormatter = require(rootPrefix + '/lib/formatter/Base'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

/**
 * Class for channel stat single formatter.
 *
 * @class ChannelStatSingleFormatter
 */
class ChannelStatSingleFormatter extends BaseFormatter {
  /**
   * Constructor for channel stat single formatter.
   *
   * @param {object} params
   * @param {object} params.channelStat
   * @param {number} params.channelDetail.id
   * @param {number} params.channelDetail.totalUsers
   * @param {number} params.channelDetail.totalVideos
   * @param {number} params.channelDetail.updatedAt
   *
   * @augments BaseFormatter
   *
   * @constructor
   */
  constructor(params) {
    super();

    const oThis = this;

    oThis.channelStat = params.channelStat;
  }

  /**
   * Validate the input objects.
   *
   * @returns {result}
   * @private
   */
  _validate() {
    const oThis = this;

    const channelStatKeyConfig = {
      id: { isNullAllowed: false },
      totalUsers: { isNullAllowed: false },
      totalVideos: { isNullAllowed: false },
      updatedAt: { isNullAllowed: false }
    };

    return oThis.validateParameters(oThis.channelStat, channelStatKeyConfig);
  }

  /**
   * Format the input object.
   *
   * @returns {object|result}
   */
  _format() {
    const oThis = this;

    return responseHelper.successWithData({
      id: oThis.channelStat.id,
      totalUsers: Number(oThis.channelStat.totalUsers),
      totalVideos: Number(oThis.channelStat.totalVideos),
      uts: oThis.channelStat.updatedAt
    });
  }
}

module.exports = ChannelStatSingleFormatter;
