const rootPrefix = '../../..',
  BaseMetaFormatter = require(rootPrefix + '/lib/formatter/meta/Base');

class ChannelList extends BaseMetaFormatter {
  /**
   * Append service specific keys in meta
   *
   * @param meta
   * @private
   */
  _appendSpecificMetaData(meta) {
    const oThis = this;

    return oThis._checkForExtraDataInMeta(meta);
  }

  _checkForExtraDataInMeta(meta) {
    const oThis = this;

    if (oThis.meta.search_term) {
      meta.search_term = oThis.meta.search_term;
    }

    if (oThis.meta.search_kind) {
      meta.search_kind = oThis.meta.search_kind;
    }

    if (oThis.meta.search_sub_kind) {
      meta.search_sub_kind = oThis.meta.search_sub_kind;
    }

    meta.search_in_all = oThis.meta.search_in_all;

    return meta;
  }
}

module.exports = ChannelList;
