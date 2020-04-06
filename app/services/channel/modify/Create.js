const rootPrefix = '../../../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  ModifyChannel = require(rootPrefix + '/lib/channel/ModifyChannel'),
  ChannelModel = require(rootPrefix + '/app/models/mysql/channel/Channel'),
  ChannelStatModel = require(rootPrefix + '/app/models/mysql/channel/ChannelStat'),
  bgJob = require(rootPrefix + '/lib/rabbitMqEnqueue/bgJob'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  bgJobConstants = require(rootPrefix + '/lib/globalConstant/bgJob'),
  slackConstants = require(rootPrefix + '/lib/globalConstant/slack'),
  createErrorLogsEntry = require(rootPrefix + '/lib/errorLogs/createEntry'),
  errorLogsConstants = require(rootPrefix + '/lib/globalConstant/errorLogs'),
  entityTypeConstants = require(rootPrefix + '/lib/globalConstant/entityType'),
  channelConstants = require(rootPrefix + '/lib/globalConstant/channel/channels');

/**
 * Class to create channel.
 *
 * @class CreateChannel
 */
class CreateChannel extends ServiceBase {
  /**
   * Constructor to create channel.
   *
   * @param {object} params.current_user
   * @param {number} params.current_user.id
   * @param {string} params.channel_name
   * @param {string} params.channel_tagline
   * @param {string} params.channel_description
   * @param {string} params.channel_tags
   * @param {string[]} [params.admin_user_ids]
   * @param {string} params.cover_image_url
   * @param {number} params.cover_image_file_size
   * @param {number} params.cover_image_height
   * @param {number} params.cover_image_width
   *
   * @augments ServiceBase
   *
   * @constructor
   */
  constructor(params) {
    super(params);

    const oThis = this;

    oThis.currentUser = params.current_user;

    oThis.channelName = params.channel_name;
    oThis.channelTagline = params.channel_tagline;
    oThis.channelDescription = params.channel_description;
    oThis.channelTagNames = params.channel_tags;
    oThis.coverImageUrl = params.cover_image_url;
    oThis.coverImageFileSize = params.cover_image_file_size;
    oThis.coverImageHeight = params.cover_image_height;
    oThis.coverImageWidth = params.cover_image_width;

    oThis.channelAdminUserIds = [oThis.currentUser.id];

    oThis.channelId = null;
    oThis.channelPermalink = null;
  }

  /**
   * Async perform.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _asyncPerform() {
    const oThis = this;

    oThis._validateAndSanitizeParams();

    oThis._generatePermalink();

    await oThis._createNewChannel();

    await oThis._createEntryInChannelStats();

    const updatedChannelEntity = await oThis._modifyChannel();

    await oThis._performSlackChannelMonitoringBgJob();

    return responseHelper.successWithData({ [entityTypeConstants.channel]: updatedChannelEntity });
  }

  /**
   * Sanitize input parameters.
   *
   * @sets oThis.channelName, oThis.channelTagline, oThis.channelDescription
   *
   * @private
   */
  _validateAndSanitizeParams() {
    const oThis = this;

    if (!oThis.currentUser.approvedCreator) {
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 'a_s_c_m_c_2',
          api_error_identifier: 'unauthorized_api_request',
          debug_options: {
            currentUserId: oThis.currentUser.id,
            channelName: oThis.channelName,
            channelTagline: oThis.channelTagline
          }
        })
      );
    }

    oThis.channelName = oThis.channelName.trim();
    oThis.channelTagline = oThis.channelTagline.trim();
    oThis.channelDescription = oThis.channelDescription.trim();
  }

  /**
   * Generate channel permalink.
   *
   * @sets oThis.channelPermalink
   *
   * @private
   */
  _generatePermalink() {
    const oThis = this;

    oThis.channelPermalink = oThis.channelName
      .trim() // Remove surrounding whitespace.
      .toLowerCase() // Lowercase.
      .replace(/[^a-z0-9]+/g, '-') // Find everything that is not a lowercase letter or number, one or more times, globally, and replace it with a dash.
      .replace(/^-+/, '') // Remove all dashes from the beginning of the string.
      .replace(/-+$/, ''); // Remove all dashes from the end of the string.
  }

  /**
   * Create new channel.
   *
   * @sets oThis.channelId
   *
   * @returns {Promise<void>}
   * @private
   */
  async _createNewChannel() {
    const oThis = this;

    const insertResponse = await new ChannelModel()
      .insert({
        name: oThis.channelName,
        permalink: oThis.channelPermalink,
        status: channelConstants.invertedStatuses[channelConstants.activeStatus]
      })
      .fire()
      .catch(function(err) {
        logger.log('Error while creating new channel: ', err);
        if (
          ChannelModel.isDuplicateIndexViolation(ChannelModel.nameUniqueIndexName, err) ||
          ChannelModel.isDuplicateIndexViolation(ChannelModel.permalinkUniqueIndexName, err)
        ) {
          logger.log('Name or permalink conflict.');

          return null;
        }

        return Promise.reject(err);
      });

    if (!insertResponse) {
      logger.error('Error while creating new channel in channels table.');

      return Promise.reject(
        responseHelper.paramValidationError({
          internal_error_identifier: 'a_s_c_m_c_1',
          api_error_identifier: 'invalid_api_params',
          params_error_identifiers: ['invalid_channel_name'],
          debug_options: {
            channelName: oThis.channelName,
            channelPermalink: oThis.channelPermalink
          }
        })
      );
    }

    oThis.channelId = insertResponse.insertId;

    await ChannelModel.flushCache({
      ids: [oThis.channelId],
      permalinks: [oThis.channelPermalink],
      name: oThis.channelName,
      createdAt: Math.floor(Date.now() / 1000)
    });
  }

  /**
   * Create new entry in channel stat table.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _createEntryInChannelStats() {
    const oThis = this;

    await new ChannelStatModel().insert({ channel_id: oThis.channelId, total_videos: 0, total_users: 0 }).fire();
  }

  /**
   * Modify channel.
   *
   * @returns {Promise<object>}
   * @private
   */
  async _modifyChannel() {
    const oThis = this;

    // Don't send name here since name is used while channel create.
    const modifyChannelResponse = await new ModifyChannel({
      channelId: oThis.channelId,
      channelPermalink: oThis.channelPermalink,
      description: oThis.channelDescription,
      tagline: oThis.channelTagline,
      tagNames: oThis.channelTagNames,
      adminUserIds: oThis.channelAdminUserIds,
      coverImageUrl: oThis.coverImageUrl,
      coverImageFileSize: oThis.coverImageFileSize,
      coverImageHeight: oThis.coverImageHeight,
      coverImageWidth: oThis.coverImageWidth
    }).perform();

    // TODO - channel_create - is modifyChannelResponse.isFailure() needed? Modify channel is giving reject.
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
      source_id: oThis.currentUser.id,
      channel_id: oThis.channelId,
      action: slackConstants.channelCreated
    });
  }
}

module.exports = CreateChannel;
