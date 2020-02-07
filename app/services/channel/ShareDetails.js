const uuidV4 = require('uuid/v4');

const rootPrefix = '../../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  ImageByIdCache = require(rootPrefix + '/lib/cacheManagement/multi/ImageByIds'),
  TextsByIdCache = require(rootPrefix + '/lib/cacheManagement/multi/TextsByIds'),
  ChannelByIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/channel/ChannelByIds'),
  ChannelByPermalinksCache = require(rootPrefix + '/lib/cacheManagement/multi/channel/ChannelByPermalinks'),
  basicHelper = require(rootPrefix + '/helpers/basic'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  entityTypeConstants = require(rootPrefix + '/lib/globalConstant/entityType'),
  shareEntityConstants = require(rootPrefix + '/lib/globalConstant/shareEntity'),
  channelConstants = require(rootPrefix + '/lib/globalConstant/channel/channels');

/**
 * Class to share channel details.
 *
 * @class ShareDetails
 */
class ShareDetails extends ServiceBase {
  /**
   * Constructor to share channel details.
   *
   * @param {object} params
   * @param {string} [params.channel_permalink]
   * @param {number} [params.channel_id]
   *
   * @augments ServiceBase
   *
   * @constructor
   */
  constructor(params) {
    super();

    const oThis = this;

    oThis.channelPermalink = params.channel_permalink || '';
    oThis.channelId = params.channel_id || null;

    oThis.channelName = null;
    oThis.channelTagline = null;
    oThis.channelImageUrl = null;
  }

  /**
   * Async perform.
   *
   * @returns {Promise<result>}
   * @private
   */
  async _asyncPerform() {
    const oThis = this;

    await oThis._fetchChannelDetails();

    return responseHelper.successWithData(oThis._prepareResponse());
  }

  /**
   * Fetch channel details by channel id.
   *
   * @sets oThis.channelId, oThis.channelName, oThis.channelPermalink
   *
   * @returns {Promise<never>}
   * @private
   */
  async _fetchChannelDetails() {
    const oThis = this;

    // If channel id is not passed and permalink is passed.
    if (!oThis.channelId) {
      const cacheResponse = await new ChannelByPermalinksCache({ permalinks: [oThis.channelPermalink] }).fetch();
      if (cacheResponse.isFailure()) {
        return Promise.reject(cacheResponse);
      }

      const permalinkIdsMap = cacheResponse.data;
      if (!permalinkIdsMap[oThis.channelPermalink]) {
        return Promise.reject(
          responseHelper.error({
            internal_error_identifier: 'a_s_c_sd_1',
            api_error_identifier: 'entity_not_found',
            debug_options: {
              channelPermalink: oThis.channelPermalink
            }
          })
        );
      }

      oThis.channelId = permalinkIdsMap[oThis.channelPermalink];
    }

    const channelCacheResponse = await new ChannelByIdsCache({ ids: [oThis.channelId] }).fetch(),
      channelDetails = channelCacheResponse.data[oThis.channelId];

    if (
      !CommonValidators.validateNonEmptyObject(channelDetails) ||
      channelDetails.status === channelConstants.inactiveStatus ||
      !channelDetails.name
    ) {
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 'a_s_c_sd_2',
          api_error_identifier: 'entity_not_found',
          debug_options: {
            channelPermalink: oThis.channelPermalink,
            status: channelDetails.status,
            channelName: channelDetails.name
          }
        })
      );
    }

    oThis.channelName = channelDetails.name;
    oThis.channelPermalink = oThis.channelPermalink || channelDetails.permalink;

    await Promise.all([
      oThis._fetchTagLine(channelDetails.taglineId),
      oThis._fetchCoverImage(channelDetails.coverImageId)
    ]);
  }

  /**
   * Fetch tag line of channel.
   *
   * @param {number} tagLineId
   *
   * @sets oThis.channelTagline
   *
   * @returns {Promise<void>}
   * @private
   */
  async _fetchTagLine(tagLineId) {
    const oThis = this;

    if (!tagLineId) {
      return;
    }

    const textCacheResponse = await new TextsByIdCache({ ids: [tagLineId] }).fetch();
    if (textCacheResponse.isFailure()) {
      return Promise.reject(textCacheResponse);
    }

    const channelTaglineObject = textCacheResponse.data[tagLineId];
    if (channelTaglineObject && channelTaglineObject.text) {
      oThis.channelTagline = channelTaglineObject.text;
    }
  }

  /**
   * Fetch cover image of channel.
   *
   * @param {number} imageId
   *
   * @sets oThis.channelImageUrl
   *
   * @returns {Promise<void>}
   * @private
   */
  async _fetchCoverImage(imageId) {
    const oThis = this;

    if (!imageId) {
      return;
    }

    const imageCacheResponse = await new ImageByIdCache({ ids: [imageId] }).fetch();
    if (imageCacheResponse.isFailure()) {
      return Promise.reject(imageCacheResponse);
    }

    const channelImageObject = imageCacheResponse.data[imageId];
    if (CommonValidators.validateNonEmptyObject(channelImageObject)) {
      oThis.channelImageUrl = channelImageObject.resolutions.original.url;
    }
  }

  /**
   * Prepare final response.
   *
   * @returns {{}}
   * @private
   */
  _prepareResponse() {
    const oThis = this;

    const messageObject = shareEntityConstants.getChannelShareEntity({
      channelName: oThis.channelName,
      url: oThis._generateChannelShareUrl(),
      channelTagline: oThis.channelTagline
    });

    return {
      [entityTypeConstants.share]: Object.assign(
        {
          id: uuidV4(),
          kind: shareEntityConstants.channelShareKind,
          posterImageUrl: oThis.channelImageUrl,
          uts: Math.round(new Date() / 1000)
        },
        messageObject
      )
    };
  }

  /**
   * Generate channel share url.
   *
   * @returns {string}
   * @private
   */
  _generateChannelShareUrl() {
    const oThis = this;

    return (
      basicHelper.channelPrefixUrl() +
      '/' +
      oThis.channelPermalink +
      `?utm_source=share&utm_medium=channel&utm_campaign=${oThis.channelId}`
    );
  }
}

module.exports = ShareDetails;
