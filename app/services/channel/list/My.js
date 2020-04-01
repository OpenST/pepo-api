const rootPrefix = '../../../..',
  ChannelListBase = require(rootPrefix + '/app/services/channel/list/Base'),
  ChannelModel = require(rootPrefix + '/app/models/mysql/channel/Channel'),
  ChannelIdsByUserCache = require(rootPrefix + '/lib/cacheManagement/multi/channel/ChannelIdsByUser'),
  channelUsersConstants = require(rootPrefix + '/lib/globalConstant/channel/channelUsers');

/**
 * Class to get new channels list.
 *
 * @class ChannelListMy
 */
class ChannelListMy extends ChannelListBase {
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

    const oThis = this;
  }

  /**
   * Get all Channel Ids for this list.
   *
   * @sets oThis.allCommunityIds
   *
   * @returns {Promise<never>}
   * @private
   */
  async _getAllChannelIds() {
    const oThis = this;

    const userId = oThis.current_user.id;
    const cacheResp = await new ChannelIdsByUserCache({ userIds: [userId] }).fetch();
    if (cacheResp.isFailure()) {
      return Promise.reject(cacheResp);
    }

    oThis.allChannelIds = [
      ...cacheResp.data[userId][channelUsersConstants.adminRole],
      ...cacheResp.data[userId][channelUsersConstants.normalRole]
    ];
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

    await oThis._getAllChannelIds();

    if (oThis.allChannelIds.length === 0) {
      return;
    }

    const params = {
      offset: oThis._offset(),
      limit: oThis.limit,
      channelPrefix: oThis.channelPrefix,
      ids: oThis.allChannelIds
    };

    const resp = await new ChannelModel().searchChannelsByPrefix(params);

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
    const oThis = this;
    return true;
  }

  /**
   * Return Sub kind for meta.
   *
   * @returns {string}
   * @private
   */
  _subKind() {
    const oThis = this;
    return 'my';
  }
}

module.exports = ChannelListMy;
