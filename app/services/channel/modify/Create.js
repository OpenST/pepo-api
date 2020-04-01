const rootPrefix = '../../../..',
  FilterTags = require(rootPrefix + '/lib/FilterOutTags'),
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  TagModel = require(rootPrefix + '/app/models/mysql/Tag'),
  TextModel = require(rootPrefix + '/app/models/mysql/Text'),
  UserModel = require(rootPrefix + '/app/models/mysql/User'),
  FilterOutLinks = require(rootPrefix + '/lib/FilterOutLinks'),
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  ChannelModel = require(rootPrefix + '/app/models/mysql/channel/Channel'),
  AddInChannelLib = require(rootPrefix + '/lib/channelTagVideo/AddTagInChannel'),
  ChannelStatModel = require(rootPrefix + '/app/models/mysql/channel/ChannelStat'),
  ChangeChannelUserRoleLib = require(rootPrefix + '/lib/channel/ChangeChannelUserRole'),
  AdminActivityLogModel = require(rootPrefix + '/app/models/mysql/admin/AdminActivityLog'),
  ChannelByIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/channel/ChannelByIds'),
  ChannelByPermalinksCache = require(rootPrefix + '/lib/cacheManagement/multi/channel/ChannelByPermalinks'),
  imageLib = require(rootPrefix + '/lib/imageLib'),
  tagConstants = require(rootPrefix + '/lib/globalConstant/tag'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  textConstants = require(rootPrefix + '/lib/globalConstant/text'),
  imageConstants = require(rootPrefix + '/lib/globalConstant/image'),
  channelConstants = require(rootPrefix + '/lib/globalConstant/channel/channels'),
  channelUserConstants = require(rootPrefix + '/lib/globalConstant/channel/channelUsers'),
  adminActivityLogConstants = require(rootPrefix + '/lib/globalConstant/admin/adminActivityLogs');

// Declare constants.
const ORIGINAL_IMAGE_WIDTH = 1500;
const ORIGINAL_IMAGE_HEIGHT = 642;

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
   * @param {string[]} [params.tag_names]
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

    oThis.channelTagNames = params.tag_names || [];
    oThis.channelAdminUserIds = params.admin_user_ids || [];

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

    await oThis._generatePermalink();
    await oThis._createNewChannel();
    await oThis._createEntryInChannelStats();

    return responseHelper.successWithData({ channel: oThis.channel });
  }

  async _generatePermalink() {
    return '';
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
   * Log admin activity.
   *
   * @returns {Promise<void>}
   * @private
   */
  async logAdminActivity() {
    const oThis = this;

    await new AdminActivityLogModel().insertAction({
      adminId: oThis.currentAdminId,
      actionOn: oThis.channelId,
      extraData: JSON.stringify({ cid: [oThis.channelId], chPml: oThis.channelPermalink }),
      action: adminActivityLogConstants.createEditCommunityEntity
    });
  }
}

module.exports = CreateChannel;
