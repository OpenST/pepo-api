const rootPrefix = '../../../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  ModifyChannel = require(rootPrefix + '/lib/channel/ModifyChannel'),
  FetchAssociatedEntities = require(rootPrefix + '/lib/FetchAssociatedEntities'),
  ChannelByIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/channel/ChannelByIds'),
  GetCurrentUserChannelRelationsLib = require(rootPrefix + '/lib/channel/GetCurrentUserChannelRelations'),
  bgJob = require(rootPrefix + '/lib/rabbitMqEnqueue/bgJob'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  bgJobConstants = require(rootPrefix + '/lib/globalConstant/bgJob'),
  slackConstants = require(rootPrefix + '/lib/globalConstant/slack'),
  createErrorLogsEntry = require(rootPrefix + '/lib/errorLogs/createEntry'),
  errorLogsConstants = require(rootPrefix + '/lib/globalConstant/errorLogs'),
  entityTypeConstants = require(rootPrefix + '/lib/globalConstant/entityType'),
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
   * @param {object} params.current_user
   * @param {number} params.current_user.id
   *
   * @param {number} params.channel_id
   * @param {string} params.channel_name
   * @param {string} params.channel_tagline
   * @param {string} params.channel_description
   * @param {string} params.channel_tags
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

    oThis.currentUserId = params.current_user.id;

    oThis.channelId = params.channel_id;
    oThis.channelName = params.channel_name;
    oThis.channelTagline = params.channel_tagline;
    oThis.channelDescription = params.channel_description;
    oThis.channelTagNames = JSON.parse(params.channel_tags);

    oThis.coverImageUrl = params.cover_image_url || '';
    oThis.coverImageFileSize = params.cover_image_file_size || 0;
    oThis.coverImageHeight = params.cover_image_height || 0;
    oThis.coverImageWidth = params.cover_image_width || 0;

    oThis.channel = {};
    oThis.channelTaglineId = null;
    oThis.channelDescriptionId = null;

    oThis.texts = {};

    oThis.updateRequiredParameters = {
      channelId: oThis.channelId,
      tagNames: oThis.channelTagNames
    };
  }

  /**
   * Async perform.
   *
   * @returns {Promise<result>}
   * @private
   */
  async _asyncPerform() {
    const oThis = this;

    await oThis._validateAndSanitize();

    await oThis._fetchAssociatedEntities();

    oThis._decideUpdateRequiredParameters();

    const updatedChannelEntity = await oThis._modifyChannel();

    await oThis._performSlackChannelMonitoringBgJob();

    return responseHelper.successWithData({ [entityTypeConstants.channel]: updatedChannelEntity });
  }

  /**
   * Validate and sanitize input parameters.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _validateAndSanitize() {
    const oThis = this;

    oThis._sanitizeInputParameters();

    await oThis._validateExistingChannel();

    await oThis._validateCurrentUserChannelRelations();

    await oThis._validateCoverImageParameters();
  }

  /**
   * Sanitize input parameters.
   *
   * @sets oThis.channelName, oThis.channelTagline, oThis.channelDescription
   *
   * @private
   */
  _sanitizeInputParameters() {
    const oThis = this;

    oThis.channelName = oThis.channelName.trim();
    oThis.channelTagline = oThis.channelTagline.trim();
    oThis.channelDescription = oThis.channelDescription.trim();
  }

  /**
   * Validate status of existing channel.
   *
   * @sets oThis.channel, oThis.channelTaglineId, oThis.channelDescriptionId, oThis.updateRequiredParameters
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

    if (!CommonValidators.validateNonEmptyObject(oThis.channel)) {
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

    if (oThis.channel.status !== channelConstants.activeStatus) {
      return Promise.reject(
        responseHelper.paramValidationError({
          internal_error_identifier: 'a_s_c_m_e_vec_1',
          api_error_identifier: 'invalid_api_params',
          params_error_identifiers: ['channel_not_active'],
          debug_options: {
            channelId: oThis.channelId,
            channelDetails: oThis.channel
          }
        })
      );
    }

    oThis.channelTaglineId = oThis.channel.taglineId;
    oThis.channelDescriptionId = oThis.channel.descriptionId;
    oThis.updateRequiredParameters.channelPermalink = oThis.channel.permalink;
  }

  /**
   * Fetch current user channel relations and validate whether user is an admin of the channel or not.
   *
   * @returns {Promise<never>}
   * @private
   */
  async _validateCurrentUserChannelRelations() {
    const oThis = this;

    const currentUserChannelRelationsResponse = await new GetCurrentUserChannelRelationsLib({
      currentUserId: oThis.currentUserId,
      channelIds: [oThis.channelId]
    }).perform();
    if (currentUserChannelRelationsResponse.isFailure()) {
      return Promise.reject(currentUserChannelRelationsResponse);
    }

    const currentUserChannelRelations =
      currentUserChannelRelationsResponse.data.currentUserChannelRelations[oThis.channelId];

    if (!currentUserChannelRelations.isAdmin) {
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 'a_s_c_m_e_vcucr_1',
          api_error_identifier: 'unauthorized_api_request',
          debug_options: {
            channelId: oThis.channelId,
            currentUserId: oThis.currentUserId,
            currentUserChannelRelations: currentUserChannelRelations
          }
        })
      );
    }
  }

  /**
   * Validate cover image related parameters.
   *
   * @returns {Promise<never>}
   * @private
   */
  async _validateCoverImageParameters() {
    const oThis = this;

    if (oThis.coverImageUrl && (!oThis.coverImageFileSize || !oThis.coverImageHeight || !oThis.coverImageWidth)) {
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 'a_s_c_m_e_vcip_1',
          api_error_identifier: 'invalid_api_params',
          debug_options: {
            channelId: oThis.channelId,
            coverImageUrl: oThis.coverImageUrl,
            coverImageFileSize: oThis.coverImageFileSize,
            coverImageHeight: oThis.coverImageHeight,
            coverImageWidth: oThis.coverImageWidth
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
      textIds: [oThis.channelTaglineId, oThis.channelDescriptionId]
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

    if (oThis.texts[oThis.channelTaglineId] && oThis.texts[oThis.channelTaglineId].text !== oThis.channelTagline) {
      oThis.updateRequiredParameters.tagline = oThis.channelTagline;
    }

    if (
      oThis.texts[oThis.channelDescriptionId] &&
      oThis.texts[oThis.channelDescriptionId].text !== oThis.channelDescription
    ) {
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
   * @returns {Promise<object>}
   * @private
   */
  async _modifyChannel() {
    const oThis = this;

    const modifyChannelResponse = await new ModifyChannel(oThis.updateRequiredParameters).perform();
    if (modifyChannelResponse.isFailure()) {
      await createErrorLogsEntry.perform(modifyChannelResponse, errorLogsConstants.highSeverity);

      return Promise.reject(modifyChannelResponse);
    }

    return modifyChannelResponse.data.channel;
  }

  /**
   * Perform slack channel monitoring job enqueuing.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _performSlackChannelMonitoringBgJob() {
    const oThis = this;

    await bgJob.enqueue(bgJobConstants.slackChannelMonitoringJobTopic, {
      source: slackConstants.userSource,
      source_id: oThis.currentUserId,
      channel_id: oThis.channelId,
      action: slackConstants.channelUpdated
    });
  }
}

module.exports = EditChannel;
