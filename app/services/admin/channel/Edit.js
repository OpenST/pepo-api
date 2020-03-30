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
  ChannelByIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/channel/ChannelByIds'),
  ChannelByPermalinksCache = require(rootPrefix + '/lib/cacheManagement/multi/channel/ChannelByPermalinks'),
  imageLib = require(rootPrefix + '/lib/imageLib'),
  tagConstants = require(rootPrefix + '/lib/globalConstant/tag'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  textConstants = require(rootPrefix + '/lib/globalConstant/text'),
  imageConstants = require(rootPrefix + '/lib/globalConstant/image'),
  channelConstants = require(rootPrefix + '/lib/globalConstant/channel/channels'),
  channelUserConstants = require(rootPrefix + '/lib/globalConstant/channel/channelUsers');

// Declare constants.
const ORIGINAL_IMAGE_WIDTH = 1500;
const ORIGINAL_IMAGE_HEIGHT = 642;
const SHARE_IMAGE_WIDTH = 1500;
const SHARE_IMAGE_HEIGHT = 750;

/**
 * Class to edit channel.
 *
 * @class EditChannel
 */
class EditChannel extends ServiceBase {
  /**
   * Constructor to edit channel.
   *
   * @param {number} params.is_edit
   * @param {string} [params.name]
   * @param {string} [params.description]
   * @param {string} [params.tagline]
   * @param {string} params.permalink
   * @param {string[]} [params.tags]
   * @param {string[]} [params.admins]
   * @param {string} [params.original_image_url]
   * @param {number} [params.original_image_file_size]
   * @param {string} [params.share_image_url]
   * @param {number} [params.share_image_file_size]
   *
   * @augments ServiceBase
   *
   * @constructor
   */
  constructor(params) {
    super(params);

    const oThis = this;

    oThis.isEdit = Number(params.is_edit);
    oThis.channelName = params.name;
    oThis.channelDescription = params.description;
    oThis.channelTagline = params.tagline;
    oThis.channelPermalink = params.permalink;
    oThis.channelAdminUserNames = params.admins ? params.admins.split(',') : [];
    oThis.channelTagNames = params.tags ? params.tags.split(',') : [];
    oThis.originalImageUrl = params.original_image_url;
    oThis.originalImageFileSize = params.original_image_file_size;
    oThis.shareImageUrl = params.share_image_url;
    oThis.shareImageFileSize = params.share_image_file_size;

    oThis.channelId = null;

    oThis.tagIds = [];
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
      await oThis._updateChannelName();
    } else {
      await oThis._validateChannelCreationParameters();
      await oThis._createNewChannel();
    }

    await Promise.all([
      oThis._performChannelTaglineRelatedTasks(),
      oThis._performChannelDescriptionRelatedTasks(),
      oThis._performImageUrlRelatedTasks(),
      oThis._performShareImageUrlRelatedTasks(),
      oThis._createEntryInChannelStats(),
      oThis._associateAdminsToChannel(),
      oThis._associateTagsToChannel()
    ]);

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

    await oThis._validateExistingChannel();

    if (oThis.isEdit) {
      await oThis._validateExistingChannelStatus();
    }
  }

  /**
   * Validate existing channel using channelPermalink.
   *
   * @sets oThis.channelId
   *
   * @returns {Promise<never>}
   * @private
   */
  async _validateExistingChannel() {
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
        responseHelper.error({
          internal_error_identifier: 'a_s_a_c_e_vec_1',
          api_error_identifier: 'invalid_api_params',
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
  }

  /**
   * Validate status of existing channel.
   *
   * @returns {Promise<never>}
   * @private
   */
  async _validateExistingChannelStatus() {
    const oThis = this;

    const channelCacheResponse = await new ChannelByIdsCache({ ids: [oThis.channelId] }).fetch();
    if (channelCacheResponse.isFailure()) {
      return Promise.reject(channelCacheResponse);
    }

    const channel = channelCacheResponse.data[oThis.channelId];

    if (!CommonValidators.validateNonEmptyObject(channel) || channel.status !== channelConstants.activeStatus) {
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
  }

  /**
   * Update channel name.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _updateChannelName() {
    const oThis = this;

    if (!oThis.channelName) {
      return;
    }

    const updateResponse = await new ChannelModel()
      .update({ name: oThis.channelName })
      .where({ id: oThis.channelId })
      .fire()
      .catch(function(err) {
        logger.log('Error while updating channel name: ', err);
        if (ChannelModel.isDuplicateIndexViolation(ChannelModel.nameUniqueIndexName, err)) {
          logger.log('Name conflict.');

          return null;
        }

        return Promise.reject(err);
      });

    if (!updateResponse) {
      logger.error('Error while updating channel name channels table.');

      return Promise.reject(
        responseHelper.paramValidationError({
          internal_error_identifier: 'a_s_a_c_e_ucn_1',
          api_error_identifier: 'invalid_api_params',
          params_error_identifiers: ['invalid_channel_id'],
          debug_options: { channelName: oThis.channelName }
        })
      );
    }

    await ChannelModel.flushCache({ ids: [oThis.channelId] });
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
      !oThis.originalImageUrl ||
      !oThis.shareImageUrl ||
      !oThis.originalImageFileSize ||
      !oThis.shareImageFileSize
    ) {
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 'a_s_a_c_e_vccp_1',
          api_error_identifier: 'invalid_api_params',
          debug_options: {
            channelName: oThis.channelName,
            channelDescription: oThis.channelDescription,
            channelTagline: oThis.channelTagline
          }
        })
      );
    }

    // We are not validating channelAdminUserNames and channelTagNames as they are not mandatory for creating a new channel.
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
          params_error_identifiers: ['invalid_channel_id'],
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
   * Perform channel tagline related tasks.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _performChannelTaglineRelatedTasks() {
    const oThis = this;

    if (oThis.channelTagline) {
      // Create new entry in texts table.
      const textRow = await new TextModel().insertText({
        text: oThis.channelTagline,
        kind: textConstants.channelTaglineKind
      });

      const textInsertId = textRow.insertId;

      // Filter out tags from channel tagline.
      await new FilterTags(oThis.channelTagline, textInsertId).perform();

      await TextModel.flushCache({ ids: [textInsertId] });

      // Update channel table.
      await new ChannelModel()
        .update({ tagline_id: textInsertId })
        .where({ id: oThis.channelId })
        .fire();

      await ChannelModel.flushCache({ ids: [oThis.channelId] });
    }
  }

  /**
   * Perform channel description related tasks.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _performChannelDescriptionRelatedTasks() {
    const oThis = this;

    if (oThis.channelDescription) {
      // Create new entry in texts table.
      const textRow = await new TextModel().insertText({
        text: oThis.channelDescription,
        kind: textConstants.channelDescriptionKind
      });

      const textInsertId = textRow.insertId;

      // Filter out tags from channel description.
      await new FilterTags(oThis.channelDescription, textInsertId).perform();

      // Filter out links from channel description.
      await new FilterOutLinks(oThis.channelDescription, textInsertId).perform();

      await TextModel.flushCache({ ids: [textInsertId] });

      // Update channel table.
      await new ChannelModel()
        .update({ description_id: textInsertId })
        .where({ id: oThis.channelId })
        .fire();

      await ChannelModel.flushCache({ ids: [oThis.channelId], permalinks: [oThis.channelPermalink] });
    }
  }

  /**
   * Perform image url related tasks.
   *
   * @returns {Promise<never>}
   * @private
   */
  async _performImageUrlRelatedTasks() {
    const oThis = this;

    if (oThis.originalImageUrl) {
      const imageParams = {
        imageUrl: oThis.originalImageUrl,
        size: oThis.originalImageFileSize,
        width: ORIGINAL_IMAGE_WIDTH,
        height: ORIGINAL_IMAGE_HEIGHT,
        kind: imageConstants.channelImageKind,
        channelId: oThis.channelId,
        isExternalUrl: false,
        enqueueResizer: true
      };

      // Validate and save image.
      const resp = await imageLib.validateAndSave(imageParams);
      if (resp.isFailure()) {
        return Promise.reject(resp);
      }

      const imageData = resp.data;

      // Update channel table.
      await new ChannelModel()
        .update({ cover_image_id: imageData.insertId })
        .where({ id: oThis.channelId })
        .fire();

      await ChannelModel.flushCache({ ids: [oThis.channelId] });
    }
  }

  /**
   * Perform share image url related tasks.
   *
   * @returns {Promise<never>}
   * @private
   */
  async _performShareImageUrlRelatedTasks() {
    const oThis = this;

    if (oThis.shareImageUrl) {
      const imageParams = {
        imageUrl: oThis.shareImageUrl,
        size: oThis.shareImageFileSize,
        width: SHARE_IMAGE_WIDTH,
        height: SHARE_IMAGE_HEIGHT,
        kind: imageConstants.channelShareImageKind,
        channelId: oThis.channelId,
        isExternalUrl: false,
        enqueueResizer: true
      };

      // Validate and save image.
      const resp = await imageLib.validateAndSave(imageParams);
      if (resp.isFailure()) {
        return Promise.reject(resp);
      }

      const imageData = resp.data;

      // Update channel table.
      await new ChannelModel()
        .update({ share_image_id: imageData.insertId })
        .where({ id: oThis.channelId })
        .fire();

      await ChannelModel.flushCache({ ids: [oThis.channelId] });
    }
  }

  /**
   * Create new entry in channel stat table.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _createEntryInChannelStats() {
    const oThis = this;

    if (oThis.isEdit) {
      return;
    }

    await new ChannelStatModel()
      .insert({ channel_id: oThis.channelId, total_videos: 0, total_users: 0 })
      .fire()
      .catch(function(error) {
        logger.log('Avoid this error while updating channel. Error while creating channel stats: ', error);
      });
  }

  /**
   * Associate admins to channel.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _associateAdminsToChannel() {
    const oThis = this;

    if (oThis.channelAdminUserNames.length === 0) {
      return;
    }

    for (let index = 0; index < oThis.channelAdminUserNames.length; index++) {
      oThis.channelAdminUserNames[index] = oThis.channelAdminUserNames[index].trim();
    }

    const userNamesToUserMap = await new UserModel().fetchByUserNames(oThis.channelAdminUserNames);

    if (Object.keys(userNamesToUserMap).length !== oThis.channelAdminUserNames.length) {
      logger.error('Some admins are not present in user db.');

      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 'a_s_a_c_e_aatc_1',
          api_error_identifier: 'something_went_wrong',
          debug_options: {
            adminUserNames: oThis.adminUserNames
          }
        })
      );
    }

    const adminUserIds = [];

    for (const userName in userNamesToUserMap) {
      adminUserIds.push(userNamesToUserMap[userName].id);
    }

    const promiseArray = [];

    for (let ind = 0; ind < adminUserIds.length; ind++) {
      promiseArray.push(
        new ChangeChannelUserRoleLib({
          userId: adminUserIds[ind],
          channelId: oThis.channelId,
          role: channelUserConstants.adminRole
        }).perform()
      );
    }

    await Promise.all(promiseArray);
  }

  /**
   * Associate tags to channel.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _associateTagsToChannel() {
    const oThis = this;

    if (oThis.channelTagNames.length === 0) {
      return;
    }

    for (let index = 0; index < oThis.channelTagNames.length; index++) {
      oThis.channelTagNames[index] = oThis.channelTagNames[index].trim();
    }

    await oThis._fetchOrCreateTags();

    const promiseArray = [];

    for (let ind = 0; ind < oThis.tagIds.length; ind++) {
      promiseArray.push(
        new AddInChannelLib({
          channelId: oThis.channelId,
          tagId: oThis.tagIds[ind]
        }).perform()
      );
    }

    await Promise.all(promiseArray);
  }

  /**
   * Fetch existing or create new tags.
   *
   * @sets oThis.tagIds
   *
   * @returns {Promise<void>}
   * @private
   */
  async _fetchOrCreateTags() {
    const oThis = this;

    const tagNameToTagIdMap = {},
      newTagsToInsert = [],
      newTagsToCreateArray = [];

    const dbRows = await new TagModel()
      .select(['id', 'name'])
      .where({ name: oThis.channelTagNames })
      .fire();

    for (let index = 0; index < dbRows.length; index++) {
      const formatDbRow = new TagModel()._formatDbData(dbRows[index]);
      tagNameToTagIdMap[formatDbRow.name.toLowerCase()] = formatDbRow;
      oThis.tagIds.push(formatDbRow.id);
    }

    for (let ind = 0; ind < oThis.channelTagNames.length; ind++) {
      const inputTagName = oThis.channelTagNames[ind];
      if (!tagNameToTagIdMap[inputTagName.toLowerCase()]) {
        newTagsToInsert.push(inputTagName);
        newTagsToCreateArray.push([inputTagName, 0, tagConstants.invertedStatuses[tagConstants.activeStatus]]);
      }
    }

    // Creates new tags.
    if (newTagsToCreateArray.length > 0) {
      await new TagModel().insertTags(newTagsToCreateArray);

      // Fetch new inserted tags.
      const newTags = await new TagModel().getTags(newTagsToInsert);

      for (let ind = 0; ind < newTags.length; ind++) {
        oThis.tagIds.push(newTags[ind].id);
      }
    }

    if (oThis.channelTagNames.length !== oThis.tagIds.length) {
      logger.log('Some tags are not present in db.\nPlease verify.');

      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 'a_s_a_c_e_foct_1',
          api_error_identifier: 'something_went_wrong',
          debug_options: {
            channelTagNames: oThis.channelTagNames,
            tagIds: oThis.tagIds
          }
        })
      );
    }
  }
}

module.exports = EditChannel;
