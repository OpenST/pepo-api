const rootPrefix = '../../..',
  CacheSingleBase = require(rootPrefix + '/lib/cacheManagement/single/Base'),
  ChannelModel = require(rootPrefix + '/app/models/mysql/channel/Channel'),
  channelConstants = require(rootPrefix + '/lib/globalConstant/channel/channels'),
  CuratedEntityIdsByKindCache = require(rootPrefix + '/lib/cacheManagement/single/CuratedEntityIdsByKind'),
  MeetingGetLiveChannelIdsCache = require(rootPrefix + '/lib/cacheManagement/single/meeting/MeetingGetLiveChannelIds'),
  curatedEntitiesConstants = require(rootPrefix + '/lib/globalConstant/curatedEntities'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  basicHelper = require(rootPrefix + '/helpers/basic'),
  cacheManagementConstants = require(rootPrefix + '/lib/globalConstant/cacheManagement');

/**
 * Class to get sorted list of channels based on some parameters
 *
 * @class DefaultChannelsListForWeb
 */
class DefaultChannelsListForWeb extends CacheSingleBase {
  /**
   * Init params in oThis.
   *
   * @param {object} params
   *
   * @private
   */
  _initParams(params) {
    const oThis = this;
  }

  /**
   * Set use object.
   *
   * @sets oThis.useObject
   *
   * @private
   */
  _setUseObject() {
    const oThis = this;

    oThis.useObject = true;
  }

  /**
   * Set cache type.
   *
   * @sets oThis.cacheType
   *
   * @returns {string}
   */
  _setCacheType() {
    const oThis = this;

    oThis.cacheType = cacheManagementConstants.memcached;
  }

  /**
   * Set cache key.
   *
   * @sets oThis.cacheKey
   *
   * @returns {string}
   */
  setCacheKey() {
    const oThis = this;

    oThis.cacheKey = `${oThis._cacheKeyPrefix()}_chn_top_ids`;

    return oThis.cacheKey;
  }

  /**
   * Set cache expiry in oThis.cacheExpiry and return it.
   *
   * @sets oThis.cacheExpiry
   *
   * @returns {number}
   */
  setCacheExpiry() {
    const oThis = this;

    oThis.cacheExpiry = cacheManagementConstants.smallExpiryTimeInterval;

    return oThis.cacheExpiry;
  }

  /**
   * Fetch data from source.
   *
   * @returns {Result}
   */
  async fetchDataFromSource() {
    const oThis = this;

    const cacheResp = await new MeetingGetLiveChannelIdsCache().fetch();

    if (cacheResp.isFailure()) {
      return Promise.reject(cacheResp);
    }

    const liveChannelIds = cacheResp.data.ids;
    const liveChannelIdMap = {};

    for (let i = 0; i < liveChannelIds.length; i++) {
      liveChannelIdMap[liveChannelIds[i]] = 1;
    }

    const channels = await new ChannelModel().select('*').fire();
    let allChannelIds = [];
    let sortedChannelIds = [];

    for (let i = 0; i < channels.length; i++) {
      if (channels[i].status == channelConstants.invertedStatuses[channelConstants.activeStatus]) {
        const channelId = channels[i].id;
        allChannelIds.push(channelId);
        if (liveChannelIdMap[channelId]) {
          sortedChannelIds.push(Number(channelId));
        }
      }
    }

    // Fetch all curated channel ids
    const cacheResponse = await new CuratedEntityIdsByKindCache({
      entityKind: curatedEntitiesConstants.channelsEntityKind
    }).fetch();
    if (cacheResponse.isFailure()) {
      return Promise.reject(cacheResponse);
    }

    const curatedChannelIds = cacheResponse.data.entityIds;
    sortedChannelIds = basicHelper.uniquate(sortedChannelIds.concat(curatedChannelIds));
    const sortedChannelMap = {};
    for (let i = 0; i < sortedChannelIds.length; i++) {
      sortedChannelMap[sortedChannelIds[i]] = 1;
    }
    for (let i = 0; i < allChannelIds.length; i++) {
      const chId = allChannelIds[i];
      if (!sortedChannelMap[chId]) {
        sortedChannelIds.push(chId);
      }
    }

    return responseHelper.successWithData({ channelIds: sortedChannelIds });
  }
}

module.exports = DefaultChannelsListForWeb;
