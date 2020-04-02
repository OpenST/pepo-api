const rootPrefix = '../..',
  FilterTags = require(rootPrefix + '/lib/FilterOutTags'),
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  TagModel = require(rootPrefix + '/app/models/mysql/Tag'),
  TextModel = require(rootPrefix + '/app/models/mysql/Text'),
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  FilterOutLinks = require(rootPrefix + '/lib/FilterOutLinks'),
  ChannelModel = require(rootPrefix + '/app/models/mysql/channel/Channel'),
  ChannelByIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/channel/ChannelByIds'),
  UsersCache = require(rootPrefix + '/lib/cacheManagement/multi/User'),
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
   * @param {number} params.channelId
   * @param {number} params.channelPermalink
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
    const oThis = this;

    oThis.channelId = params.channelId;
    oThis.channelPermalink = params.channelPermalink;

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
    oThis.toBeUpdatedInChannel = {};
    oThis.channel = null;
    oThis.channelNewAdminUserData = {};
  }

  /**
   * Async perform.
   *
   * @returns {Promise<void>}
   * @private
   */
  async perform() {
    const oThis = this;

    await oThis._validateParams();

    await oThis._updateChannelName();
    await oThis._performChannelTaglineRelatedTasks();
    await oThis._performChannelDescriptionRelatedTasks();
    await oThis._performImageUrlRelatedTasks();
    await oThis._associateAdminsToChannel();
    await oThis._associateTagsToChannel();
    await oThis._updateChannel();

    return responseHelper.successWithData({ channel: oThis.channel });
  }

  async _validateParams() {
    const oThis = this;

    // Fetch all channelAdminUserIds and check whether they are pepo users.
    const cacheRsp = await new UsersCache({ ids: [oThis.channelAdminUserIds] }).fetch();
    if (cacheRsp.isFailure()) {
      return Promise.reject(
        responseHelper.paramValidationError({
          internal_error_identifier: 'l_c_mc_2',
          api_error_identifier: 'invalid_params',
          params_error_identifiers: ['invalid_admin_id'],
          debug_options: {
            channelId: oThis.channelId,
            channelAdminUserIds: oThis.channelAdminUserIds
          }
        })
      );
    }

    oThis.channelNewAdminUserData = cacheRsp.data;
    for (let caui = 0; caui < oThis.channelAdminUserIds.length; caui++) {
      const adminUserId = oThis.channelAdminUserIds[caui];
      if (!oThis.channelNewAdminUserData[adminUserId]) {
        return Promise.reject(
          responseHelper.paramValidationError({
            internal_error_identifier: 'l_c_mc_3',
            api_error_identifier: 'invalid_params',
            params_error_identifiers: ['invalid_admin_id'],
            debug_options: {
              channelId: oThis.channelId,
              invalidAdminId: adminUserId,
              channelAdminUserIds: oThis.channelAdminUserIds
            }
          })
        );
      }
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
          internal_error_identifier: 'l_c_mc_1',
          api_error_identifier: 'invalid_api_params',
          params_error_identifiers: ['invalid_channel_name'],
          debug_options: { channelName: oThis.channelName }
        })
      );
    }

    await ChannelModel.flushCache({ ids: [oThis.channelId] });
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

      oThis.toBeUpdatedInChannel['tagline_id'] = textInsertId;
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

      oThis.toBeUpdatedInChannel['tagline_id'] = textInsertId;
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
        imageUrl: oThis.coverImageUrl,
        size: oThis.coverImageFileSize,
        width: oThis.coverImageWidth,
        height: oThis.coverImageHeight,
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

      oThis.toBeUpdatedInChannel['cover_image_id'] = imageData.insertId;
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

    if (oThis.channelAdminUserIds.length == 0) {
      return;
    }

    const promiseArray = [];

    for (let ind = 0; ind < oThis.channelAdminUserIds.length; ind++) {
      promiseArray.push(
        new ChangeChannelUserRoleLib({
          userId: oThis.channelAdminUserIds[ind],
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

  /**
   * update channel and clear respective cache
   * @returns {Promise<void>}
   * @private
   */
  async _updateChannel() {
    const oThis = this;

    if (CommonValidators.validateNonEmptyObject(oThis.toBeUpdatedInChannel)) {
      return;
    }

    // Update channel table.
    await new ChannelModel()
      .update(oThis.toBeUpdatedInChannel)
      .where({ id: oThis.channelId })
      .fire();

    await ChannelModel.flushCache({ ids: [oThis.channelId], permalinks: [oThis.channelPermalink] });
  }

  /**
   * Get updated channel object
   *
   * @returns {Promise<never>}
   * @private
   */
  async _getChannel() {
    const oThis = this;

    const channelCacheResponse = await new ChannelByIdsCache({ ids: [oThis.channelId] }).fetch();
    if (channelCacheResponse.isFailure()) {
      return Promise.reject(channelCacheResponse);
    }

    oThis.channel = channelCacheResponse.data[oThis.channelId];
  }
}

module.exports = ModifyChannel;
