const rootPrefix = '../../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  ImageByIdCache = require(rootPrefix + '/lib/cacheManagement/multi/ImageByIds'),
  ChannelByIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/channel/ChannelByIds'),
  ChannelNamePaginationCache = require(rootPrefix + '/lib/cacheManagement/single/ChannelNamePagination'),
  basicHelper = require(rootPrefix + '/helpers/basic'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  paginationConstants = require(rootPrefix + '/lib/globalConstant/pagination');

/**
 * Class to search channels.
 *
 * @class ChannelSearch
 */
class ChannelSearch extends ServiceBase {
  /**
   * Constructor to search channels.
   *
   * @param {object} params
   * @param {string} params.q
   * @param {string} params.pagination_identifier
   *
   * @augments ServiceBase
   *
   * @constructor
   */
  constructor(params) {
    super();

    const oThis = this;

    oThis.channelPrefix = params.q || null;
    oThis.paginationIdentifier = params[paginationConstants.paginationIdentifierKey] || null;

    oThis.limit = null;
    oThis.page = null;
    oThis.channelIds = [];
    oThis.channels = {};

    oThis.imageIds = [];
    oThis.descriptionIds = [];

    oThis.imageMap = {};
  }

  /**
   * Async perform.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _asyncPerform() {
    const oThis = this;

    await oThis._validateAndSanitizeParams();

    await oThis._getChannelIds();

    await oThis._getChannels();

    await oThis._fetchImages();

    const responseMetaData = oThis._finalResponse();

    return responseHelper.successWithData({
      channelIds: oThis.channelIds,
      channelsMap: oThis.channels,
      imageMap: oThis.imageMap,
      meta: responseMetaData
    });
  }

  /**
   * Validate and sanitize specific params.
   *
   * @sets oThis.page, oThis.limit
   *
   * @returns {Promise<never>}
   * @private
   */
  async _validateAndSanitizeParams() {
    const oThis = this;

    oThis.channelPrefix = basicHelper.filterSearchTerm(oThis.channelPrefix);

    if (oThis.paginationIdentifier) {
      const parsedPaginationParams = oThis._parsePaginationParams(oThis.paginationIdentifier);
      oThis.page = parsedPaginationParams.page; // Override page
    } else {
      oThis.page = 1;
    }
    oThis.limit = paginationConstants.defaultChannelListPageSize;

    return oThis._validatePageSize();
  }

  /**
   * Get channel ids.
   *
   * @sets oThis.channelIds
   *
   * @returns {Promise<void>}
   * @private
   */
  async _getChannelIds() {
    const oThis = this;

    if (oThis.channelPrefix) {
      const channelPaginationRsp = await new ChannelNamePaginationCache({
        limit: oThis.limit,
        page: oThis.page,
        channelPrefix: oThis.channelPrefix
      }).fetch();

      oThis.channelIds = channelPaginationRsp.data.channelIds;
    }
  }

  /**
   * Get channels.
   *
   * @sets oThis.channels, oThis.imageIds, oThis.descriptionIds
   *
   * @returns {Promise<void>}
   * @private
   */
  async _getChannels() {
    const oThis = this;

    if (oThis.channelIds.length === 0) {
      return;
    }

    const channelsResponse = await new ChannelByIdsCache({ ids: oThis.channelIds }).fetch();

    oThis.channels = channelsResponse.data;

    for (const channelId in oThis.channels) {
      const channel = oThis.channels[channelId];
      if (channel.imageId) {
        oThis.imageIds.push(channel.coverImageId);
      }

      if (channel.descriptionId) {
        oThis.descriptionIds.push(channel.descriptionId);
      }
    }
  }

  /**
   * Fetch images.
   *
   * @sets oThis.imageMap
   *
   * @return {Promise<*>}
   * @private
   */
  async _fetchImages() {
    const oThis = this;

    if (oThis.imageIds.length < 1) {
      return;
    }

    const cacheRsp = await new ImageByIdCache({ ids: oThis.imageIds }).fetch();
    if (cacheRsp.isFailure()) {
      return Promise.reject(cacheRsp);
    }

    oThis.imageMap = cacheRsp.data;
  }

  /**
   * Get meta.
   *
   * @returns {Promise<*>}
   * @private
   */
  _finalResponse() {
    const oThis = this;

    const nextPagePayloadKey = {};

    if (oThis.channelIds.length >= oThis.limit && oThis.channelPrefix) {
      nextPagePayloadKey[paginationConstants.paginationIdentifierKey] = {
        page: oThis.page + 1
      };
    }

    return {
      [paginationConstants.nextPagePayloadKey]: nextPagePayloadKey,
      // temp hardcoding, move to constants.
      search_term: oThis.channelPrefix,
      search_kind: 'channels'
    };
  }

  /**
   * Returns default page limit.
   *
   * @returns {number}
   * @private
   */
  _defaultPageLimit() {
    return paginationConstants.defaultChannelListPageSize;
  }

  /**
   * Returns minimum page limit.
   *
   * @returns {number}
   * @private
   */
  _minPageLimit() {
    return paginationConstants.minChannelListPageSize;
  }

  /**
   * Returns maximum page limit.
   *
   * @returns {number}
   * @private
   */
  _maxPageLimit() {
    return paginationConstants.maxChannelListPageSize;
  }

  /**
   * Returns current page limit.
   *
   * @returns {number}
   * @private
   */
  _currentPageLimit() {
    const oThis = this;

    return oThis.limit;
  }
}

module.exports = ChannelSearch;
