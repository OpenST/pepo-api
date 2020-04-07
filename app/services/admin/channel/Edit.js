const rootPrefix = '../../../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  ModifyChannel = require(rootPrefix + '/lib/channel/ModifyChannel'),
  ChannelModel = require(rootPrefix + '/app/models/mysql/channel/Channel'),
  FetchAssociatedEntities = require(rootPrefix + '/lib/FetchAssociatedEntities'),
  ChannelStatModel = require(rootPrefix + '/app/models/mysql/channel/ChannelStat'),
  AdminActivityLogModel = require(rootPrefix + '/app/models/mysql/admin/AdminActivityLog'),
  ChannelByIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/channel/ChannelByIds'),
  UserIdByUserNamesCache = require(rootPrefix + '/lib/cacheManagement/multi/UserIdByUserNames'),
  ChannelByPermalinksCache = require(rootPrefix + '/lib/cacheManagement/multi/channel/ChannelByPermalinks'),
  UsersCache = require(rootPrefix + '/lib/cacheManagement/multi/User'),
  bgJob = require(rootPrefix + '/lib/rabbitMqEnqueue/bgJob'),
  userConstants = require(rootPrefix + '/lib/globalConstant/user'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  bgJobConstants = require(rootPrefix + '/lib/globalConstant/bgJob'),
  slackConstants = require(rootPrefix + '/lib/globalConstant/slack'),
  createErrorLogsEntry = require(rootPrefix + '/lib/errorLogs/createEntry'),
  errorLogsConstants = require(rootPrefix + '/lib/globalConstant/errorLogs'),
  channelConstants = require(rootPrefix + '/lib/globalConstant/channel/channels'),
  adminActivityLogConstants = require(rootPrefix + '/lib/globalConstant/admin/adminActivityLogs');

// Declare constants.
const COVER_IMAGE_WIDTH = 1500;
const COVER_IMAGE_HEIGHT = 642;

/**
 * Class to edit channel.
 *
 * @class EditChannel
 */
class EditChannel extends ServiceBase {
  /**
   * Constructor to edit channel.
   *
   * @param {object} params.current_admin
   * @param {number} params.current_admin.id
   * @param {string} params.permalink
   * @param {number} params.is_edit
   * @param {string} [params.channel_name]
   * @param {string} [params.channel_tagline]
   * @param {string} [params.channel_description]
   * @param {string[]} [params.channel_tags]
   * @param {string[]} [params.channel_admins]
   * @param {string} [params.cover_image_url]
   * @param {number} [params.cover_image_file_size]
   *
   * @augments ServiceBase
   *
   * @constructor
   */
  constructor(params) {
    super(params);

    const oThis = this;

    oThis.currentAdminId = params.current_admin.id;
    oThis.channelPermalink = params.permalink;
    oThis.isEdit = Number(params.is_edit);

    oThis.channelName = params.channel_name || '';
    oThis.channelTagline = params.channel_tagline || '';
    oThis.channelDescription = params.channel_description || '';
    oThis.channelTagNames = params.channel_tags ? params.channel_tags.split(',') : [];
    oThis.channelAdminUserNames = params.channel_admins ? params.channel_admins.split(',') : [];
    oThis.coverImageUrl = params.cover_image_url;
    oThis.coverImageFileSize = params.cover_image_file_size;

    oThis.existingChannelName = null;
    oThis.channelId = null;
    oThis.channelTaglineId = null;
    oThis.channelDescriptionId = null;

    oThis.adminUserIds = [];

    oThis.texts = {};

    oThis.updateRequiredParameters = {
      tagNames: oThis.channelTagNames,
      channelPermalink: oThis.channelPermalink
    };
  }

  /**
   * Async perform.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _asyncPerform() {
    const oThis = this;

    await oThis._validateAndSanitize();

    if (oThis.isEdit) {
      await oThis._fetchAssociatedEntities();
    } else {
      await oThis._createNewChannel();
      await oThis._createEntryInChannelStats();
    }

    oThis._decideUpdateRequiredParameters();
    await oThis._modifyChannel();

    await Promise.all([oThis._performSlackChannelMonitoringBgJob(), oThis.logAdminActivity()]);

    return responseHelper.successWithData({});
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

    await oThis._validateChannelPermalink();

    await oThis._validateCoverImageParameters();

    if (oThis.isEdit) {
      await oThis._validateChannel();
    } else {
      await oThis._validateChannelCreationParameters();
    }

    await oThis._fetchAdminUserIds();
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
   * Validate existing channel using channelPermalink.
   *
   * @sets oThis.channelId, oThis.updateRequiredParameters
   *
   * @returns {Promise<never>}
   * @private
   */
  async _validateChannelPermalink() {
    const oThis = this;

    const lowercaseChannelPermalink = oThis.channelPermalink.toLowerCase();
    const cacheResponse = await new ChannelByPermalinksCache({
      permalinks: [lowercaseChannelPermalink]
    }).fetch();

    if (cacheResponse.isFailure()) {
      return Promise.reject(cacheResponse);
    }

    const permalinkIdsMap = cacheResponse.data;

    // If admin wants to edit a channel, the channel should already exist.
    if (oThis.isEdit && !CommonValidators.validateNonEmptyObject(permalinkIdsMap[lowercaseChannelPermalink])) {
      return Promise.reject(
        responseHelper.paramValidationError({
          internal_error_identifier: 'a_s_a_c_e_vec_1',
          api_error_identifier: 'invalid_api_params',
          params_error_identifiers: ['invalid_channel_permalink'],
          debug_options: {
            channelPermalink: oThis.channelPermalink,
            isEdit: oThis.isEdit
          }
        })
      );
    }

    // If admin wants to create a new channel, the channel should not already exist.
    if (!oThis.isEdit && CommonValidators.validateNonEmptyObject(permalinkIdsMap[lowercaseChannelPermalink])) {
      return Promise.reject(
        responseHelper.paramValidationError({
          internal_error_identifier: 'a_s_a_c_e_vec_2',
          api_error_identifier: 'invalid_api_params',
          params_error_identifiers: ['duplicate_channel_entry'],
          debug_options: {
            channelPermalink: oThis.channelPermalink,
            isEdit: oThis.isEdit
          }
        })
      );
    }

    // This will be set only in case of isEdit = 1.
    oThis.channelId = permalinkIdsMap[lowercaseChannelPermalink].id;
    oThis.updateRequiredParameters.channelId = oThis.channelId;
  }

  /**
   * Validate cover image related parameters.
   *
   * @returns {Promise<never>}
   * @private
   */
  async _validateCoverImageParameters() {
    const oThis = this;

    if (oThis.coverImageUrl && !oThis.coverImageFileSize) {
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 'a_s_a_c_e_vcip_1',
          api_error_identifier: 'invalid_api_params',
          debug_options: {
            channelId: oThis.channelId,
            coverImageUrl: oThis.coverImageUrl,
            coverImageFileSize: oThis.coverImageFileSize
          }
        })
      );
    }
  }

  /**
   * Validate status of existing channel.
   *
   * @sets oThis.existingChannelName, oThis.channelTaglineId, oThis.channelDescriptionId, oThis.updateRequiredParameters
   *
   * @returns {Promise<never>}
   * @private
   */
  async _validateChannel() {
    const oThis = this;

    const channelCacheResponse = await new ChannelByIdsCache({ ids: [oThis.channelId] }).fetch();
    if (channelCacheResponse.isFailure()) {
      return Promise.reject(channelCacheResponse);
    }

    const channel = channelCacheResponse.data[oThis.channelId];

    if (!CommonValidators.validateNonEmptyObject(channel)) {
      return Promise.reject(
        responseHelper.paramValidationError({
          internal_error_identifier: 'a_s_a_c_e_vecs_1',
          api_error_identifier: 'invalid_api_params',
          params_error_identifiers: ['invalid_channel_id'],
          debug_options: {
            channelId: oThis.channelId,
            channelDetails: channel
          }
        })
      );
    }

    if (channel.status !== channelConstants.activeStatus) {
      return Promise.reject(
        responseHelper.paramValidationError({
          internal_error_identifier: 'a_s_a_c_e_vecs_2',
          api_error_identifier: 'invalid_api_params',
          params_error_identifiers: ['channel_not_active'],
          debug_options: {
            channelId: oThis.channelId,
            channelDetails: channel
          }
        })
      );
    }

    oThis.existingChannelName = channel.name;
    oThis.channelTaglineId = channel.taglineId;
    oThis.channelDescriptionId = channel.descriptionId;
  }

  /**
   * Validate input parameters in case of community creation.
   *
   * @returns {Promise<never>}
   * @private
   */
  async _validateChannelCreationParameters() {
    const oThis = this;

    if (
      !oThis.channelName ||
      !oThis.channelDescription ||
      !oThis.channelTagline ||
      !oThis.coverImageUrl ||
      !oThis.coverImageFileSize ||
      !oThis.channelTagNames ||
      oThis.channelTagNames.length == 0 ||
      !oThis.channelAdminUserNames ||
      oThis.channelAdminUserNames.length == 0
    ) {
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 'a_s_a_c_e_vccp_1',
          api_error_identifier: 'invalid_api_params',
          debug_options: {
            channelName: oThis.channelName,
            channelDescription: oThis.channelDescription,
            channelTagline: oThis.channelTagline,
            coverImageUrl: oThis.coverImageUrl,
            coverImageFileSize: oThis.coverImageFileSize,
            channelTagNames: oThis.channelTagNames,
            channelAdminUserNames: oThis.channelAdminUserNames
          }
        })
      );
    }

    // We are not validating channelAdminUserNames and channelTagNames as they are not mandatory for creating a new channel.
  }

  /**
   * Fetch and validate admins usernames.
   *
   * @sets oThis.adminUserIds
   *
   * @returns {Promise<void>}
   * @private
   */
  async _fetchAdminUserIds() {
    const oThis = this;

    if (oThis.channelAdminUserNames.length === 0) {
      return;
    }

    for (let caun = 0; caun < oThis.channelAdminUserNames.length; caun++) {
      oThis.channelAdminUserNames[caun] = oThis.channelAdminUserNames[caun].trim();
    }

    const cacheResponse = await new UserIdByUserNamesCache({ userNames: oThis.channelAdminUserNames }).fetch();
    if (cacheResponse.isFailure()) {
      return Promise.reject(cacheResponse);
    }

    const cacheData = cacheResponse.data;

    for (let index = 0; index < oThis.channelAdminUserNames.length; index++) {
      const userName = oThis.channelAdminUserNames[index],
        user = cacheData[userName];

      if (!user || !user.id) {
        return Promise.reject(
          responseHelper.paramValidationError({
            internal_error_identifier: 'a_s_a_c_e_faui_1',
            api_error_identifier: 'invalid_api_params',
            params_error_identifiers: ['invalid_admin_id'],
            debug_options: { userName: userName }
          })
        );
      }

      if (cacheData[userName].status !== userConstants.activeStatus) {
        return Promise.reject(
          responseHelper.paramValidationError({
            internal_error_identifier: 'a_s_a_c_e_faui_2',
            api_error_identifier: 'invalid_api_params',
            params_error_identifiers: ['user_inactive'],
            debug_options: { userName: userName }
          })
        );
      }

      oThis.adminUserIds.push(user.id);
    }

    console.log('---------oThis.channelAdminUserNames-----', oThis.channelAdminUserNames);

    const adminUsersCacheRsp = await new UsersCache({ ids: oThis.adminUserIds }).fetch();
    if (adminUsersCacheRsp.isFailure()) {
      return Promise.reject(adminUsersCacheRsp);
    }
    const adminUsersCacheRspData = adminUsersCacheRsp.data;
    console.log('---------adminUsersCacheRsp-----', adminUsersCacheRspData);

    for (let caui = 0; caui < oThis.adminUserIds.length; caui++) {
      const adminUserId = oThis.adminUserIds[caui],
        adminUserDetail = adminUsersCacheRspData[adminUserId];
      if (!adminUserDetail.approvedCreator) {
        return Promise.reject(
          responseHelper.paramValidationError({
            internal_error_identifier: 'a_s_a_c_e_faui_3',
            api_error_identifier: 'invalid_api_params',
            params_error_identifiers: ['user_is_not_approved'],
            debug_options: { userId: adminUserId, userName: adminUserDetail.name }
          })
        );
      }
    }
  }

  /**
   * Fetch associated entities.
   *
   * @sets oThis.texts
   *
   * @returns {Promise<void>}
   * @private
   */
  async _fetchAssociatedEntities() {
    const oThis = this;

    const textsIds = [];
    if (oThis.channelTagline) {
      textsIds.push(oThis.channelTaglineId);
    }

    if (oThis.channelDescription) {
      textsIds.push(oThis.channelDescriptionId);
    }

    if (textsIds.length === 0) {
      return;
    }

    const associatedEntitiesResponse = await new FetchAssociatedEntities({
      textIds: [oThis.channelTaglineId, oThis.channelDescriptionId]
    }).perform();
    if (associatedEntitiesResponse.isFailure()) {
      return Promise.reject(associatedEntitiesResponse);
    }

    oThis.texts = associatedEntitiesResponse.data.textMap;
  }

  /**
   * Create new channel.
   *
   * @sets oThis.channelId, oThis.updateRequiredParameters
   *
   * @returns {Promise<void>}
   * @private
   */
  async _createNewChannel() {
    const oThis = this;

    const insertResponse = await new ChannelModel()
      .insert({
        name: oThis.channelName,
        status: channelConstants.invertedStatuses[channelConstants.activeStatus],
        permalink: oThis.channelPermalink
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
          internal_error_identifier: 'a_s_a_c_e_cnc_1',
          api_error_identifier: 'invalid_api_params',
          params_error_identifiers: ['duplicate_channel_entry'],
          debug_options: {
            channelName: oThis.channelName,
            channelPermalink: oThis.channelPermalink
          }
        })
      );
    }

    oThis.channelId = insertResponse.insertId;
    oThis.updateRequiredParameters.channelId = oThis.channelId;

    await ChannelModel.flushCache({ name: oThis.channelName, createdAt: Math.floor(Date.now() / 1000) });
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

    if (oThis.isEdit) {
      if (oThis.channelName && oThis.existingChannelName !== oThis.channelName) {
        oThis.updateRequiredParameters.name = oThis.channelName;
      }

      if (
        oThis.channelTagline &&
        oThis.texts[oThis.channelTaglineId] &&
        oThis.texts[oThis.channelTaglineId].text !== oThis.channelTagline
      ) {
        oThis.updateRequiredParameters.tagline = oThis.channelTagline;
      }

      if (
        oThis.channelDescription &&
        oThis.texts[oThis.channelDescriptionId] &&
        oThis.texts[oThis.channelDescriptionId].text !== oThis.channelDescription
      ) {
        oThis.updateRequiredParameters.description = oThis.channelDescription;
      }

      if (oThis.coverImageUrl) {
        oThis.updateRequiredParameters.coverImageUrl = oThis.coverImageUrl;
        oThis.updateRequiredParameters.coverImageWidth = COVER_IMAGE_WIDTH;
        oThis.updateRequiredParameters.coverImageHeight = COVER_IMAGE_HEIGHT;
        oThis.updateRequiredParameters.coverImageFileSize = oThis.coverImageFileSize;
      }

      if (oThis.adminUserIds.length > 0) {
        oThis.updateRequiredParameters.adminUserIds = oThis.adminUserIds;
      }
    } else {
      oThis.updateRequiredParameters.tagline = oThis.channelTagline;
      oThis.updateRequiredParameters.description = oThis.channelDescription;
      oThis.updateRequiredParameters.coverImageUrl = oThis.coverImageUrl;
      oThis.updateRequiredParameters.coverImageWidth = COVER_IMAGE_WIDTH;
      oThis.updateRequiredParameters.coverImageHeight = COVER_IMAGE_HEIGHT;
      oThis.updateRequiredParameters.coverImageFileSize = oThis.coverImageFileSize;
      oThis.updateRequiredParameters.adminUserIds = oThis.adminUserIds;
    }
  }

  /**
   * Modify channel.
   *
   * @returns {Promise<never>}
   * @private
   */
  async _modifyChannel() {
    const oThis = this;

    const modifyChannelResponse = await new ModifyChannel(oThis.updateRequiredParameters).perform();

    if (modifyChannelResponse.isFailure()) {
      await createErrorLogsEntry.perform(modifyChannelResponse, errorLogsConstants.highSeverity);

      return Promise.reject(modifyChannelResponse);
    }
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

  /**
   * Perform slack channel monitoring job enqueuing.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _performSlackChannelMonitoringBgJob() {
    const oThis = this;

    const enqueueObject = {
      source: slackConstants.adminSource,
      source_id: oThis.currentAdminId,
      channel_id: oThis.channelId
    };

    if (oThis.isEdit) {
      await bgJob.enqueue(bgJobConstants.slackChannelMonitoringJobTopic, {
        ...enqueueObject,
        action: slackConstants.channelUpdated
      });
    } else {
      await bgJob.enqueue(bgJobConstants.slackChannelMonitoringJobTopic, {
        ...enqueueObject,
        action: slackConstants.channelCreated
      });
    }
  }
}

module.exports = EditChannel;
