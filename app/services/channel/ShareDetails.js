const uuidV4 = require('uuid/v4');

const rootPrefix = '../../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  ImageByIdCache = require(rootPrefix + '/lib/cacheManagement/multi/ImageByIds'),
  TextsByIdCache = require(rootPrefix + '/lib/cacheManagement/multi/TextsByIds'),
  ChannelByIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/ChannelByIds'),
  coreConstants = require(rootPrefix + '/config/coreConstants'),
  gotoConstants = require(rootPrefix + '/lib/globalConstant/goto'),
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
   * @param {number} params.channel_id
   *
   * @augments ServiceBase
   *
   * @constructor
   */
  constructor(params) {
    super();

    const oThis = this;

    oThis.channelId = params.channel_id;

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
   * @sets oThis.channelName, oThis.channelTagline, oThis.channelImageUrl
   *
   * @returns {Promise<never>}
   * @private
   */
  async _fetchChannelDetails() {
    const oThis = this;

    const cacheResponse = await new ChannelByIdsCache({ ids: [oThis.channelId] }).fetch();
    if (cacheResponse.isFailure()) {
      return Promise.reject(cacheResponse);
    }

    const channelDetails = cacheResponse.data[oThis.channelId];

    if (
      !CommonValidators.validateNonEmptyObject(channelDetails) ||
      channelDetails.status === channelConstants.inactiveStatus ||
      !channelDetails.channelName
    ) {
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 'a_s_c_sd_1',
          api_error_identifier: 'entity_not_found',
          debug_options: {
            inputChannelId: oThis.channelId,
            status: channelDetails.status,
            creatorUserId: channelDetails.channelName
          }
        })
      );
    }

    oThis.channelName = channelDetails.channelName;

    // Fetch tagline if available.
    if (channelDetails.taglineId) {
      const textCacheResp = await new TextsByIdCache({ ids: [channelDetails.taglineId] }).fetch();
      if (textCacheResp.isFailure()) {
        return Promise.reject(textCacheResp);
      }

      const videoDescription = textCacheResp.data[channelDetails.taglineId];

      if (videoDescription && videoDescription.text) {
        oThis.channelTagline = videoDescription.text;
      }
    }

    // Fetch channel image if available.
    if (channelDetails.imageId) {
      const imageId = channelDetails.imageId;
      const cacheRsp = await new ImageByIdCache({ ids: [imageId] }).fetch();
      if (cacheRsp.isFailure()) {
        return Promise.reject(cacheRsp);
      }

      oThis.channelImageUrl = cacheRsp.data[imageId].resolutions.original.url;
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
          channelImageUrl: oThis.channelImageUrl,
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
      coreConstants.PA_DOMAIN +
      '/' +
      gotoConstants.channelGotoKind +
      '/' +
      oThis.channelId +
      `?utm_source=share&utm_medium=channel&utm_campaign=${oThis.channelId}`
    );
  }
}

module.exports = ShareDetails;
