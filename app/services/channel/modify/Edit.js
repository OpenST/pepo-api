const rootPrefix = '../../../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  ModifyChannel = require(rootPrefix + '/lib/channel/ModifyChannel'),
  FetchAssociatedEntities = require(rootPrefix + '/lib/FetchAssociatedEntities'),
  ChannelByIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/channel/ChannelByIds'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  createErrorLogsEntry = require(rootPrefix + '/lib/errorLogs/createEntry'),
  errorLogsConstants = require(rootPrefix + '/lib/globalConstant/errorLogs'),
  channelConstants = require(rootPrefix + '/lib/globalConstant/channel/channels');

/**
 * Class to edit channel.
 *
 * @class EditChannel
 */
class EditChannel extends ServiceBase {
  /**
   * Constructor to edit channel.
   *
   * @param {number} params.channel_id
   * @param {string} params.name
   * @param {string} params.tagline
   * @param {string} params.description
   * @param {string[]} params.tag_names
   * @param {string} [params.cover_image_url]
   * @param {number} [params.cover_image_file_size]
   * @param {number} [params.cover_image_height]
   * @param {number} [params.cover_image_width]
   *
   * @augments ServiceBase
   *
   * @constructor
   */
  constructor(params) {
    super(params);

    const oThis = this;

    oThis.channelId = params.channel_id;
    oThis.channelName = params.name;
    oThis.channelTagline = params.tagline;
    oThis.channelDescription = params.description;
    oThis.channelTagNames = params.tag_names;

    oThis.coverImageUrl = params.cover_image_url || '';
    oThis.coverImageFileSize = params.cover_image_file_size || 0;
    oThis.coverImageHeight = params.cover_image_height || 0;
    oThis.coverImageWidth = params.cover_image_width || 0;

    oThis.channel = {};
    oThis.channelTaglineId = 0;
    oThis.channelDescriptionId = 0;
    oThis.textIds = [];
    oThis.texts = {};

    oThis.updateRequiredParameters = { channelId: oThis.channelId, tagNames: oThis.channelTagNames };
  }

  /**
   * Async perform.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _asyncPerform() {
    const oThis = this;

    await oThis._validateExistingChannel();

    await oThis._validateInputParameters();

    await oThis._fetchAssociatedEntities();

    oThis._decideUpdateRequiredParameters();

    await oThis._modifyChannel();

    return responseHelper.successWithData({ channel: oThis.channel });
  }

  /**
   * Validate status of existing channel.
   *
   * @sets oThis.channel, oThis.textIds, oThis.channelTaglineId, oThis.channelDescriptionId
   *
   * @returns {Promise<never>}
   * @private
   */
  async _validateExistingChannel() {
    const oThis = this;

    const channelCacheResponse = await new ChannelByIdsCache({ ids: [oThis.channelId] }).fetch();
    if (channelCacheResponse.isFailure()) {
      return Promise.reject(channelCacheResponse);
    }

    oThis.channel = channelCacheResponse.data[oThis.channelId];

    if (
      !CommonValidators.validateNonEmptyObject(oThis.channel) ||
      oThis.channel.status !== channelConstants.activeStatus
    ) {
      return Promise.reject(
        responseHelper.paramValidationError({
          internal_error_identifier: 'a_s_c_m_e_vec_1',
          api_error_identifier: 'invalid_api_params',
          params_error_identifiers: ['invalid_channel_id'],
          debug_options: {
            channelId: oThis.channelId,
            channelDetails: oThis.channel
          }
        })
      );
    }

    if (oThis.channel.taglineId) {
      oThis.channelTaglineId = oThis.channel.taglineId;
      oThis.textIds.push(oThis.channel.taglineId);
    }

    if (oThis.channel.descriptionId) {
      oThis.channelDescriptionId = oThis.channel.descriptionId;
      oThis.textIds.push(oThis.channel.descriptionId);
    }
  }

  /**
   * Validate input parameters.
   *
   * @returns {Promise<never>}
   * @private
   */
  async _validateInputParameters() {
    const oThis = this;

    if (oThis.coverImageUrl && (!oThis.coverImageFileSize || !oThis.coverImageHeight || !oThis.coverImageWidth)) {
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 'a_s_c_m_e_vip_1',
          api_error_identifier: 'invalid_api_params',
          debug_options: {
            channelId: oThis.channelId,
            channelDetails: oThis.channel
          }
        })
      );
    }
  }

  /**
   * Fetch associated entities.
   *
   * @sets oThis.texts
   *
   * @returns {Promise<never>}
   * @private
   */
  async _fetchAssociatedEntities() {
    const oThis = this;

    const associatedEntitiesResponse = await new FetchAssociatedEntities({
      textIds: oThis.textIds
    }).perform();
    if (associatedEntitiesResponse.isFailure()) {
      return Promise.reject(associatedEntitiesResponse);
    }

    oThis.texts = associatedEntitiesResponse.data.textMap;
  }

  /**
   * Decide which channel values need to be updated.
   *
   * @sets oThis.updateRequiredParameters
   *
   * @private
   */
  _decideUpdateRequiredParameters() {
    const oThis = this;

    // We are not converting strings to lowerCase before checking intentionally.
    // Somebody might need to change the case of the strings.

    if (oThis.channel.name !== oThis.channelName) {
      oThis.updateRequiredParameters.name = oThis.channelName;
    }

    if (
      oThis.channelTaglineId &&
      oThis.texts[oThis.channelTaglineId] &&
      oThis.texts[oThis.channelTaglineId].text !== oThis.channelTagline
    ) {
      oThis.updateRequiredParameters.tagline = oThis.channelTagline;
    } else if (oThis.channelTagline) {
      oThis.updateRequiredParameters.tagline = oThis.channelTagline;
    }

    if (
      oThis.channelDescriptionId &&
      oThis.texts[oThis.channelDescriptionId] &&
      oThis.texts[oThis.channelDescriptionId].text !== oThis.channelDescription
    ) {
      oThis.updateRequiredParameters.description = oThis.channelDescription;
    } else if (oThis.channelDescription) {
      oThis.updateRequiredParameters.description = oThis.channelDescription;
    }

    if (oThis.coverImageUrl) {
      oThis.updateRequiredParameters.coverImageUrl = oThis.coverImageUrl;
      oThis.updateRequiredParameters.coverImageWidth = oThis.coverImageWidth;
      oThis.updateRequiredParameters.coverImageHeight = oThis.coverImageHeight;
      oThis.updateRequiredParameters.coverImageFileSize = oThis.coverImageFileSize;
    }
  }

  /**
   * Modify channel.
   *
   * @sets oThis.channel
   *
   * @returns {Promise<never>}
   * @private
   */
  async _modifyChannel() {
    const oThis = this;

    const response = await new ModifyChannel(oThis.updateRequiredParameters).perform();
    if (response.isFailure()) {
      const errorObject = responseHelper.error({
        internal_error_identifier: 'a_s_c_m_e_mc_1',
        api_error_identifier: 'channel_update_failed',
        debug_options: oThis.updateRequiredParameters
      });
      await createErrorLogsEntry.perform(errorObject, errorLogsConstants.highSeverity);

      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 'a_s_c_m_e_mc_2',
          api_error_identifier: 'something_went_wrong',
          debug_options: { channelId: oThis.channelId }
        })
      );
    }

    oThis.channel = response.channel;
  }
}

module.exports = EditChannel;
