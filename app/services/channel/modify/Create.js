const rootPrefix = '../../../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  ChannelModel = require(rootPrefix + '/app/models/mysql/channel/Channel'),
  ChannelStatModel = require(rootPrefix + '/app/models/mysql/channel/ChannelStat'),
  ModifyChannel = require(rootPrefix + '/lib/channel/ModifyChannel'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  createErrorLogsEntry = require(rootPrefix + '/lib/errorLogs/createEntry'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  entityTypeConstants = require(rootPrefix + '/lib/globalConstant/entityType'),
  channelConstants = require(rootPrefix + '/lib/globalConstant/channel/channels');

/**
 * Class to edit channel.
 *
 * @class CreateChannel
 */
class CreateChannel extends ServiceBase {
  /**
   * Constructor to edit channel.
   *
   * @param {object} params.current_user
   * @param {number} params.current_user.id
   * @param {number} params.channel_id
   * @param {string} [params.name]
   * @param {string} [params.description]
   * @param {string} [params.tagline]
   * @param {string[]} [params.tags]
   * @param {string[]} [params.admin_user_ids]
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
    oThis.channelName = params.name;
    oThis.channelDescription = params.description;
    oThis.channelTagline = params.tagline;

    oThis.channelTagNames = params.tags || [];
    oThis.channelAdminUserIds = params.admin_user_ids || [oThis.currentUserId];

    oThis.coverImageUrl = params.cover_image_url;
    oThis.coverImageFileSize = params.cover_image_file_size;
    oThis.coverImageHeight = params.cover_image_height;
    oThis.coverImageWidth = params.cover_image_width;

    oThis.channelPermalink = null;
    oThis.channel = null;
  }

  /**
   * Async perform.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _asyncPerform() {
    const oThis = this;

    oThis._generatePermalink();
    await oThis._createNewChannel();
    await oThis._createEntryInChannelStats();

    const updatedChannelEntity = await oThis._modifyChannel();

    return responseHelper.successWithData({ [entityTypeConstants.channel]: updatedChannelEntity });
  }

  _generatePermalink(channelName) {
    const oThis = this;

    oThis.channelPermalink = channelName
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
  }

  /**
   * Create new entry in channel stat table.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _createEntryInChannelStats() {
    const oThis = this;

    await new ChannelStatModel()
      .insert({ channel_id: oThis.channelId, total_videos: 0, total_users: 0 })
      .fire()
      .catch(function(error) {
        logger.log('Avoid this error while updating channel. Error while creating channel stats: ', error);
      });
  }

  /**
   * Modify channel.modifyChannelResponse
   * @sets oThis.channel
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
}

module.exports = CreateChannel;
