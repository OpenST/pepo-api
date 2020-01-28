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
    const oThis = this;

    return oThis._checkForExtraDataInMeta(meta);
  }

  _checkForExtraDataInMeta(meta) {
    const oThis = this;

    if (oThis.meta.filter_by_tag_id) {
      meta.filter_by_tag_id = oThis.meta.filter_by_tag_id;
    }

    return meta;
  }
}

module.exports = ChannelVideosList;
