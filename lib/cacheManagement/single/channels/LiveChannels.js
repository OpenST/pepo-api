const rootPrefix = '../../../..',
  MeetingModel = require(rootPrefix + '/app/models/mysql/meeting/Meeting'),
  CacheSingleBase = require(rootPrefix + '/lib/cacheManagement/single/Base'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  cacheManagementConstants = require(rootPrefix + '/lib/globalConstant/cacheManagement'),
  meetingConstants = require(rootPrefix + '/lib/globalConstant/meeting/meeting');

/**
 * Class to get live channels from cache.
 *
 * @class LiveChannels
 */
class LiveChannels extends CacheSingleBase {
  /**
   * Init params in oThis.
   * @private
   */
  _initParams() {}

  /**
   * Set use object.
   *
   * @sets oThis.useObject
   *
   * @private
   */
  _setUseObject() {
    const oThis = this;

    oThis.useObject = false;
  }

  /**
   * Set cache type.
   *
   * @sets oThis.cacheType
   *
   * @private
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

    oThis.cacheKey = oThis._cacheKeyPrefix() + `_live_channels`;

    return oThis.cacheKey;
  }

  /**
   * Set cache expiry in oThis.cacheExpiry and return it.
   *
   * @sets oThis.cacheExpiry
   *
   * @return {number}
   */
  setCacheExpiry() {
    const oThis = this;

    oThis.cacheExpiry = cacheManagementConstants.mediumExpiryTimeInterval;

    return oThis.cacheExpiry;
  }

  /**
   * Fetch data from source.
   *
   * @return {Result}
   */
  async fetchDataFromSource() {
    const oThis = this;

    const channelIds = [];
    const response = await new MeetingModel()
      .select('channel_id')
      .where({ is_live: meetingConstants.isLiveStatus })
      .fire();

    for (let i = 0; i < response.length; i++) {
      channelIds.push(response[i].channel_id);
    }
    return responseHelper.successWithData({
      ids: channelIds
    });
  }
}

module.exports = LiveChannels;
