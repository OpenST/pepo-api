const rootPrefix = '../../..',
  ChannelListBase = require(rootPrefix + '/app/services/channel/list/Base'),
  ChannelNewCache = require(rootPrefix + '/lib/cacheManagement/single/channel/ChannelNew');

/**
 * Class to get new channels list.
 *
 * @class ChannelListNew
 */
class ChannelListNew extends ChannelListBase {
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
    super();

    const oThis = this;
  }

  /**
   * Get all Community Ids for this list.
   *
   * @sets oThis.allCommunityIds
   *
   * @returns {Promise<never>}
   * @private
   */
  async _getAllCommunityIds() {
    const oThis = this;

    const cacheResp = await new ChannelNewCache().fetch();
    if (cacheResp.isFailure()) {
      return Promise.reject(cacheResp);
    }

    oThis.allChannelIds = cacheResp.data.ids;

    for (let i = 0; i < oThis.allChannelIds.length; i++) {
      oThis.allChannelMap[oThis.allChannelIds[i]] = 1;
    }
  }

  /**
   * Merge Live Communities in the list with there sorting logic.
   *
   * @returns {Promise<never>}
   * @private
   */
  async _mergeLiveCommunities() {
    const oThis = this;
  }

  /**
   * Set Channel Ids for current payload.
   *
   * @sets oThis.channelIds
   *
   * @returns {Promise<never>}
   * @private
   */
  async _setChannelIds() {
    const oThis = this;
  }

  /**
   * Fetch All Associated Entities.
   *
   *
   * @returns {Promise<never>}
   * @private
   */
  async _fetchAllAssociatedEntities() {
    const oThis = this;
  }

  /**
   * Format response to be returned..
   *
   * @returns {Promise<never>}
   * @private
   */
  async _formatResponse() {
    const oThis = this;
  }
}

module.exports = ChannelListNew;
