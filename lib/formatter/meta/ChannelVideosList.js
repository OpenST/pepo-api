const rootPrefix = '../../..',
  BaseMetaFormatter = require(rootPrefix + '/lib/formatter/meta/Base');

/**
 * Class for channel videos list meta formatter.
 *
 * @class ChannelVideosList
 */
class ChannelVideosList extends BaseMetaFormatter {
  /**
   * Append service specific keys in meta.
   *
   * @param {object} meta
   *
   * @private
   */
  _appendSpecificMetaData(meta) {
    return meta;
  }
}

module.exports = ChannelVideosList;
