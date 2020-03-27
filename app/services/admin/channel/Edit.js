const rootPrefix = '../../../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  FilterTags = require(rootPrefix + '/lib/FilterOutTags'),
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
   * @param {string} [params.share_image_url]
   *
   * @augments ServiceBase
   *
   * @constructor
   */
  constructor(params) {
    super(params);

    const oThis = this;

    oThis.isEdit = params.is_edit;
    oThis.channelName = params.name;
    oThis.channelDescription = params.description;
    oThis.channelTagLine = params.tagline;
    oThis.channelPermalink = params.permalink;
    oThis.channelAdminUserNames = params.admins;
    oThis.channelTagNames = params.tags;
    oThis.originalImageUrl = params.original_image_url;
    oThis.shareImageUrl = params.share_image_url;

    oThis.channelId = null;
    oThis.channel = null;

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

    if (!oThis.isEdit) {
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
          api_error_identifier: 'entity_not_found',
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
        responseHelper.error({
          internal_error_identifier: 'a_s_a_c_e_vec_2',
          api_error_identifier: 'duplicate_entry',
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
   * @sets oThis.channel
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

    oThis.channel = channelCacheResponse.data[oThis.channelId];

    if (
      !CommonValidators.validateNonEmptyObject(oThis.channel) ||
      oThis.channel.status !== channelConstants.activeStatus
    ) {
      return Promise.reject(
        responseHelper.paramValidationError({
          internal_error_identifier: 'a_s_a_c_e_vecs_1',
          api_error_identifier: 'resource_not_found',
          params_error_identifiers: ['invalid_channel_id'],
          debug_options: {
            channelId: oThis.channelId,
            channelDetails: oThis.channel
          }
        })
      );
    }
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

    if (!oThis.channelName) {
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 'a_s_a_c_e_cnc_1',
          api_error_identifier: 'invalid_api_params',
          debug_options: {
            channelPermalink: oThis.channelPermalink,
            isEdit: oThis.isEdit
          }
        })
      );
    }

    const insertResponse = await new ChannelModel()
      .insert({
        name: oThis.channelName,
        status: channelConstants.invertedStatuses[channelConstants.activeStatus],
        permalink: oThis.channelPermalink
      })
      .fire();

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

    if (!oThis.isEdit && !oThis.channelTagLine) {
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 'a_s_a_c_e_pctrt_1',
          api_error_identifier: 'invalid_api_params',
          debug_options: {
            channelPermalink: oThis.channelPermalink,
            isEdit: oThis.isEdit,
            channelTagline: oThis.channelTagline
          }
        })
      );
    }

    if (oThis.channelTagLine) {
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

    if (!oThis.isEdit && !oThis.channelDescription) {
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 'a_s_a_c_e_pcdrt_1',
          api_error_identifier: 'invalid_api_params',
          debug_options: {
            channelPermalink: oThis.channelPermalink,
            isEdit: oThis.isEdit,
            channelDescription: oThis.channelDescription
          }
        })
      );
    }

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

    if (!oThis.isEdit && !oThis.originalImageUrl) {
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 'a_s_a_c_e_piurt_1',
          api_error_identifier: 'invalid_api_params',
          debug_options: {
            channelPermalink: oThis.channelPermalink,
            isEdit: oThis.isEdit,
            originalImageUrl: oThis.originalImageUrl
          }
        })
      );
    }

    if (oThis.originalImageUrl) {
      const imageParams = {
        imageUrl: oThis.originalImageUrl,
        size: oThis.size, // TODO
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

    if (!oThis.isEdit && !oThis.shareImageUrl) {
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 'a_s_a_c_e_psiurt_1',
          api_error_identifier: 'invalid_api_params',
          debug_options: {
            channelPermalink: oThis.channelPermalink,
            isEdit: oThis.isEdit,
            shareImageUrl: oThis.shareImageUrl
          }
        })
      );
    }

    if (oThis.shareImageUrl) {
      const imageParams = {
        imageUrl: oThis.shareImageUrl,
        size: oThis.size, // TODO
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
