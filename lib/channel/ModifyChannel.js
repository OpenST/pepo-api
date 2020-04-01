const rootPrefix = '../..',
  FilterTags = require(rootPrefix + '/lib/FilterOutTags'),
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  TagModel = require(rootPrefix + '/app/models/mysql/Tag'),
  TextModel = require(rootPrefix + '/app/models/mysql/Text'),
  UserModel = require(rootPrefix + '/app/models/mysql/User'),
  FilterOutLinks = require(rootPrefix + '/lib/FilterOutLinks'),
  ChannelModel = require(rootPrefix + '/app/models/mysql/channel/Channel'),
  AddInChannelLib = require(rootPrefix + '/lib/channelTagVideo/AddTagInChannel'),
  ChangeChannelUserRoleLib = require(rootPrefix + '/lib/channel/ChangeChannelUserRole'),
  imageLib = require(rootPrefix + '/lib/imageLib'),
  tagConstants = require(rootPrefix + '/lib/globalConstant/tag'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  textConstants = require(rootPrefix + '/lib/globalConstant/text'),
  imageConstants = require(rootPrefix + '/lib/globalConstant/image'),
  channelUserConstants = require(rootPrefix + '/lib/globalConstant/channel/channelUsers');

class ModifyChannel {
  /**
   * Constructor to edit channel.
   *
   * @param {object} params.current_user
   * @param {number} params.current_user.id
   * @param {number} params.channel_id
   * @param {string} [params.name]
   * @param {string} [params.description]
   * @param {string} [params.tagline]
   * @param {string[]} [params.tagNames]
   * @param {string[]} [params.adminUserIds]
   * @param {string} [params.coverImageUrl]
   * @param {number} [params.coverImageFileSize]
   * @param {number} [params.coverImageHeight]
   * @param {number} [params.coverImageWidth]
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
    oThis.channelDescription = params.description;
    oThis.channelTagline = params.tagline;

    oThis.channelTagNames = params.tagNames || [];
    oThis.channelAdminUserIds = params.adminUserIds || [];

    oThis.coverImageUrl = params.coverImageUrl;
    oThis.coverImageFileSize = params.coverImageFileSize;
    oThis.coverImageHeight = params.coverImageHeight;
    oThis.coverImageWidth = params.coverImageWidth;

    oThis.tagIds = [];
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

    await oThis.validateParams();

    await oThis._updateChannelName();
    await oThis._performChannelTaglineRelatedTasks();
    await oThis._performChannelDescriptionRelatedTasks();
    await oThis._performImageUrlRelatedTasks();
    await oThis._associateAdminsToChannel();
    await oThis._associateTagsToChannel();

    return responseHelper.successWithData({});
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
        size: oThis.coverImageFileSize,
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
        responseHelper.paramValidationError({
          internal_error_identifier: 'a_s_a_c_e_aatc_1',
          api_error_identifier: 'invalid_api_params',
          params_error_identifiers: ['invalid_admin_usernames'],
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

module.exports = ModifyChannel;
