const rootPrefix = '../../../..',
  ChannelListBase = require(rootPrefix + '/app/services/channel/list/Base'),
  ChannelModel = require(rootPrefix + '/app/models/mysql/channel/Channel'),
  ChannelAllCache = require(rootPrefix + '/lib/cacheManagement/single/channel/ChannelAll');

/**
 * Class to get channels list from All channels.
 *
 * @class ChannelListNew
 */
class ChannelListAll extends ChannelListBase {
  /**
   * Constructor to search channels.
   *
   * @param {object} params
   * @param {object} [params.current_user]
   * @param {string} [params.q]
   * @param {string} [params.pagination_identifier]
   *
   * @augments ServiceBase
   *
   * @constructor
   */
  constructor(params) {
    super(params);
  }

  /**
   * Get all Channel Ids for this list.
   *
   * @sets oThis.allCommunityIds and oThis.allChannelMap
   *
   * @returns {Promise<never>}
   * @private
   */
  async _getAllChannelIds() {
    const oThis = this;

    const cacheResp = await new ChannelAllCache().fetch();
    if (cacheResp.isFailure()) {
      return Promise.reject(cacheResp);
    }

    oThis.allChannelIds = cacheResp.data.ids;
  }

  /**
   * Set Channel Ids for current payload of search.
   *
   * @sets oThis.channelIds, oThis.nextPageNumber
   *
   * @returns {Promise<never>}
   * @private
   */
  async _setChannelIdsForSearch() {
    const oThis = this;

    const params = {
      offset: oThis._offset(),
      limit: oThis.limit,
      channelPrefix: oThis.channelPrefix
    };

    const resp = await new ChannelModel().searchAllChannelsByPrefix(params);

    oThis.channelIds = resp.channelIds;

    if (oThis.channelIds.length >= oThis.limit) {
      oThis.nextPageNumber = oThis.currentPageNumber + 1;
    }
  }

  /**
   * Return true if live channels should be shown on top.
   *
   * @returns {boolean}
   * @private
   */
  _showLiveChannelsOnTop() {
    return false;
  }

  /**
   * Return Sub kind for meta.
   *
   * @returns {string}
   * @private
   */
  _subKind() {
    const oThis = this;
    return 'all';
  }
}

module.exports = ChannelListAll;
