const rootPrefix = '../..',
  FilterTags = require(rootPrefix + '/lib/FilterOutTags'),
  TagModel = require(rootPrefix + '/app/models/mysql/Tag'),
  TextModel = require(rootPrefix + '/app/models/mysql/Text'),
  FilterOutLinks = require(rootPrefix + '/lib/FilterOutLinks'),
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  ChannelModel = require(rootPrefix + '/app/models/mysql/channel/Channel'),
  ChannelStatModel = require(rootPrefix + '/app/models/mysql/channel/ChannelStat'),
  AddInChannelLib = require(rootPrefix + '/lib/channelTagVideo/AddTagInChannel'),
  ChannelUserModel = require(rootPrefix + '/app/models/mysql/channel/ChannelUser'),
  ChangeChannelUserRoleLib = require(rootPrefix + '/lib/channel/ChangeChannelUserRole'),
  RemoveTagFromChannelLib = require(rootPrefix + '/lib/channelTagVideo/RemoveTagFromChannel'),
  ChannelByIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/channel/ChannelByIds'),
  ChannelTagByChannelIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/channel/ChannelTagByChannelIds'),
  imageLib = require(rootPrefix + '/lib/imageLib'),
  basicHelper = require(rootPrefix + '/helpers/basic'),
  tagConstants = require(rootPrefix + '/lib/globalConstant/tag'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  textConstants = require(rootPrefix + '/lib/globalConstant/text'),
  imageConstants = require(rootPrefix + '/lib/globalConstant/image'),
  channelConstants = require(rootPrefix + '/lib/globalConstant/channel/channels'),
  channelUserConstants = require(rootPrefix + '/lib/globalConstant/channel/channelUsers');

/**
 * Class to modify channel.
 *
 * @class ModifyChannel
 */
class ModifyChannel {
  /**
   * Constructor to modify channel.
   *
   * @param {object} params.current_user
   * @param {number} params.current_user.id
   * @param {number} params.isEdit
   * @param {number} params.channelId
   * @param {number} params.channelName
   * @param {number} params.channelPermalink
   * @param {string} [params.description]
   * @param {string} [params.tagline]
   * @param {string[]} [params.tagNames]
   * @param {string[]} [params.verifiedAdminUserIds]
   * @param {string} [params.coverImageUrl]
   * @param {number} [params.coverImageFileSize]
   * @param {number} [params.coverImageHeight]
   * @param {number} [params.coverImageWidth]
   *
   * @constructor
   */
  constructor(params) {
    const oThis = this;

    oThis.isEdit = params.isEdit;
    oThis.channelId = params.channelId || null;
    oThis.channelName = params.channelName;
    oThis.channelPermalink = params.channelPermalink;

    oThis.channelDescription = params.description;
    oThis.channelTagline = params.tagline;

    oThis.channelTagNames = params.tagNames || [];
    oThis.verifiedChannelAdminUserIds = params.verifiedAdminUserIds || [];

    oThis.coverImageUrl = params.coverImageUrl;
    oThis.coverImageFileSize = params.coverImageFileSize;
    oThis.coverImageHeight = params.coverImageHeight;
    oThis.coverImageWidth = params.coverImageWidth;

    oThis.newTagIdsToBeAssociatedMap = {};
    oThis.channelExistingTagIdsMap = {};

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

    await oThis._validateAndSanitize();

    if (oThis.isEdit) {
      await oThis._updateChannelName();
    } else {
      await oThis._createNewChannel();
      await oThis._createEntryInChannelStats();
    }

    await oThis._performChannelTaglineRelatedTasks();
    await oThis._performChannelDescriptionRelatedTasks();
    await oThis._performImageUrlRelatedTasks();
    await oThis._associateAdminsToChannel();
    await oThis._associateTagsToChannel();
    await oThis._updateChannel();
    await oThis._getChannel();

    return responseHelper.successWithData({ channel: oThis.channel });
  }

  /**
   * Validate and sanitize input parameters.
   *
   * @returns {Promise<never>}
   * @private
   */
  async _validateAndSanitize() {
    const oThis = this;

    // Validate and sanitize channel name.
    const channelNameParamErrors = oThis._validateAndSanitizeChannelName();

    // Validate and sanitize channel tagline.
    const channelTaglineParamErrors = oThis._validateAndSanitizeChannelTagline();

    // Validate and sanitize channel description.
    const channelDescriptionParamErrors = oThis._validateAndSanitizeChannelDescription();

    // Validate and sanitize channel tag names.
    const channelTagNamesParamErrors = oThis._validateAndSanitizeChannelTagNames();

    const paramErrors = channelNameParamErrors
      .concat(channelTaglineParamErrors)
      .concat(channelDescriptionParamErrors)
      .concat(channelTagNamesParamErrors);

    if (paramErrors.length > 0) {
      return Promise.reject(
        responseHelper.paramValidationError({
          internal_error_identifier: 'l_c_mc_vas_1',
          api_error_identifier: 'invalid_api_params',
          params_error_identifiers: paramErrors,
          debug_options: {
            channelName: oThis.channelName,
            channelPermalink: oThis.channelPermalink,
            channelTagline: oThis.channelTagline,
            channelDescription: oThis.channelDescription,
            channelTagNames: oThis.channelTagNames
          }
        })
      );
    }
  }

  /**
   * Validate and sanitize channel name.
   *
   * @returns {[]}
   * @private
   */
  _validateAndSanitizeChannelName() {
    const oThis = this;

    const paramErrors = [];

    if (oThis.channelName) {
      oThis.channelName = oThis.channelName.trim();

      if (!CommonValidators.validateChannelNameLength(oThis.channelName)) {
        paramErrors.push('invalid_channel_name_length');
      }

      if (!CommonValidators.validateChannelNameAllowedCharacters(oThis.channelName)) {
        paramErrors.push('invalid_channel_name_characters');
      }

      if (!CommonValidators.validateStopWords(oThis.channelName)) {
        paramErrors.push('invalid_channel_name_cuss_words');
      }
    }

    return paramErrors;
  }

  /**
   * Validate and sanitize channel tagline.
   *
   * @returns {[]}
   * @private
   */
  _validateAndSanitizeChannelTagline() {
    const oThis = this;

    const paramErrors = [];

    if (oThis.channelTagline) {
      oThis.channelTagline = oThis.channelTagline.trim();

      if (!CommonValidators.validateChannelTaglineLength(oThis.channelTagline)) {
        paramErrors.push('invalid_channel_tagline_length');
      }

      if (!CommonValidators.validateStopWords(oThis.channelTagline)) {
        paramErrors.push('invalid_channel_tagline_cuss_words');
      }
    }

    return paramErrors;
  }

  /**
   * Validate and sanitize channel description.
   *
   * @returns {[]}
   * @private
   */
  _validateAndSanitizeChannelDescription() {
    const oThis = this;

    const paramErrors = [];

    if (oThis.channelDescription) {
      oThis.channelDescription = oThis.channelDescription.trim();

      if (!CommonValidators.validateChannelDescriptionLength(oThis.channelDescription)) {
        paramErrors.push('invalid_channel_description_length');
      }

      if (!CommonValidators.validateStopWords(oThis.channelDescription)) {
        paramErrors.push('invalid_channel_description_cuss_words');
      }
    }

    return paramErrors;
  }

  /**
   * Validate and sanitize channel tag names.
   *
   * @sets oThis.channelTagNames
   *
   * @returns {[]}
   * @private
   */
  _validateAndSanitizeChannelTagNames() {
    const oThis = this;

    let paramErrors = [];

    if (oThis.channelTagNames.length > 0) {
      const channelNamesPresentMap = {},
        sanitizedChannelNames = [];

      for (let index = 0; index < oThis.channelTagNames.length; index++) {
        let sanitizedChannelTagName = oThis.channelTagNames[index].trim();

        if (sanitizedChannelTagName[0] === '#') {
          sanitizedChannelTagName = sanitizedChannelTagName.substring(1, sanitizedChannelTagName.length);
        }

        if (channelNamesPresentMap[sanitizedChannelTagName.toLowerCase()]) {
          continue;
        }
        sanitizedChannelNames.push(sanitizedChannelTagName);
        channelNamesPresentMap[sanitizedChannelTagName.toLowerCase()] = 1;
      }

      oThis.channelTagNames = sanitizedChannelNames;

      if (!CommonValidators.validateChannelTagsArrayLength(oThis.channelTagNames)) {
        paramErrors.push('invalid_channel_tags_length');
      }

      for (let index = 0; index < oThis.channelTagNames.length; index++) {
        const channelTagName = oThis.channelTagNames[index];

        if (!CommonValidators.validateChannelTagLength(channelTagName)) {
          paramErrors.push('invalid_channel_tag_length');
        }

        if (!CommonValidators.validateAlphaNumericCommonSpecialCharString(channelTagName)) {
          paramErrors.push('invalid_channel_tag_characters');
        }

        if (!CommonValidators.validateStopWords(channelTagName)) {
          paramErrors.push('invalid_channel_tag_cuss_words');
        }
      }
    }

    paramErrors = basicHelper.uniquate(paramErrors);

    return paramErrors;
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
          internal_error_identifier: 'l_c_mc_1',
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
          internal_error_identifier: 'l_c_mc_2',
          api_error_identifier: 'invalid_api_params',
          params_error_identifiers: ['duplicate_channel_entry'],
          debug_options: { channelName: oThis.channelName }
        })
      );
    }

    await ChannelModel.flushCache({ ids: [oThis.channelId], name: oThis.channelName });
  }

  /**
   * Perform channel tagline related tasks.
   *
   * @sets oThis.toBeUpdatedInChannel
   *
   * @returns {Promise<void>}
   * @private
   */
  async _performChannelTaglineRelatedTasks() {
    const oThis = this;

    if (!oThis.channelTagline) {
      return;
    }

    // Create new entry in texts table.
    const textRow = await new TextModel().insertText({
      text: oThis.channelTagline,
      kind: textConstants.channelTaglineKind
    });

    const textInsertId = textRow.insertId;

    // Filter out tags from channel tagline.
    await new FilterTags(oThis.channelTagline, textInsertId).perform();

    await TextModel.flushCache({ ids: [textInsertId] });

    oThis.toBeUpdatedInChannel.tagline_id = textInsertId;
  }

  /**
   * Perform channel description related tasks.
   *
   * @sets oThis.toBeUpdatedInChannel
   *
   * @returns {Promise<void>}
   * @private
   */
  async _performChannelDescriptionRelatedTasks() {
    const oThis = this;

    if (!oThis.channelDescription) {
      return;
    }

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

    oThis.toBeUpdatedInChannel.description_id = textInsertId;
  }

  /**
   * Perform image url related tasks.
   *
   * @sets oThis.toBeUpdatedInChannel
   *
   * @returns {Promise<void>}
   * @private
   */
  async _performImageUrlRelatedTasks() {
    const oThis = this;

    if (!oThis.coverImageUrl) {
      return;
    }

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

    oThis.toBeUpdatedInChannel.cover_image_id = imageData.insertId;
  }

  /**
   * Associate admins to channel.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _associateAdminsToChannel() {
    const oThis = this;

    if (oThis.verifiedChannelAdminUserIds.length === 0) {
      return;
    }

    const adminUserIdsToAssociate = [];
    const adminUserIdsToDisassociate = [];

    // Fetch existing admins of a channel.
    const channelAdminIdMap = await new ChannelUserModel().fetchAdminProfilesByChannelIds([oThis.channelId]);

    const channelAdminIds = channelAdminIdMap[oThis.channelId];
    const existingAdminsMap = {};
    for (let index = 0; index < channelAdminIds.length; index++) {
      existingAdminsMap[channelAdminIds[index]] = 1;
    }

    const newAdminsMap = {};
    for (let index = 0; index < oThis.verifiedChannelAdminUserIds.length; index++) {
      newAdminsMap[oThis.verifiedChannelAdminUserIds[index]] = 1;
    }

    // If new admin is not an existing admin, make the new user an admin.
    // If new user is already an admin, do nothing.
    for (const newAdminUserId in newAdminsMap) {
      if (!existingAdminsMap[newAdminUserId]) {
        adminUserIdsToAssociate.push(newAdminUserId);
      }
    }

    // If old admin is not an admin anymore, make that old admin a normal user.
    // If old admin is still an admin, do nothing.
    for (const existingAdminUserId in existingAdminsMap) {
      if (!newAdminsMap[existingAdminUserId]) {
        adminUserIdsToDisassociate.push(existingAdminUserId);
      }
    }

    const promisesArray = [];

    for (let index = 0; index < adminUserIdsToAssociate.length; index++) {
      promisesArray.push(
        new ChangeChannelUserRoleLib({
          userId: adminUserIdsToAssociate[index],
          channelId: oThis.channelId,
          role: channelUserConstants.adminRole
        }).perform()
      );
    }

    for (let index = 0; index < adminUserIdsToDisassociate.length; index++) {
      promisesArray.push(
        new ChangeChannelUserRoleLib({
          userId: adminUserIdsToDisassociate[index],
          channelId: oThis.channelId,
          role: channelUserConstants.normalRole
        }).perform()
      );
    }

    await Promise.all(promisesArray);
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

    await oThis._getExistingChannelTagIds();

    const tagsToBeRemoved = [],
      tagIdsToBeAssociated = [];

    for (const existingTagId in oThis.channelExistingTagIdsMap) {
      if (!oThis.newTagIdsToBeAssociatedMap[existingTagId]) {
        tagsToBeRemoved.push(existingTagId);
      }
    }

    for (const newTagId in oThis.newTagIdsToBeAssociatedMap) {
      if (!oThis.channelExistingTagIdsMap[newTagId]) {
        tagIdsToBeAssociated.push(newTagId);
      }
    }

    const promiseArray = [];

    for (let ind = 0; ind < tagIdsToBeAssociated.length; ind++) {
      promiseArray.push(
        new AddInChannelLib({
          channelId: oThis.channelId,
          tagId: tagIdsToBeAssociated[ind]
        }).perform()
      );
    }

    for (let ind = 0; ind < tagsToBeRemoved.length; ind++) {
      promiseArray.push(
        new RemoveTagFromChannelLib({
          channelId: oThis.channelId,
          tagId: tagsToBeRemoved[ind]
        }).perform()
      );
    }

    await Promise.all(promiseArray);
  }

  /**
   * Fetch existing or create new tags.
   *
   * @sets oThis.newTagIdsToBeAssociatedMap
   *
   * @returns {Promise<void>}
   * @private
   */
  async _fetchOrCreateTags() {
    const oThis = this;

    const tagNameToTagMap = {},
      newTagsToInsert = [],
      newTagsToCreateArray = [],
      newTagIdsToBeAssociated = [];

    const dbRows = await new TagModel()
      .select(['id', 'name'])
      .where({ name: oThis.channelTagNames })
      .fire();

    for (let index = 0; index < dbRows.length; index++) {
      const formatDbRow = new TagModel()._formatDbData(dbRows[index]);
      tagNameToTagMap[formatDbRow.name.toLowerCase()] = formatDbRow;
      newTagIdsToBeAssociated.push(formatDbRow.id);
      oThis.newTagIdsToBeAssociatedMap[formatDbRow.id] = 1;
    }

    for (let ind = 0; ind < oThis.channelTagNames.length; ind++) {
      const inputTagName = oThis.channelTagNames[ind];
      if (!tagNameToTagMap[inputTagName.toLowerCase()]) {
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
        newTagIdsToBeAssociated.push(newTags[ind].id);
        oThis.newTagIdsToBeAssociatedMap[newTags[ind].id] = 1;
      }
    }

    if (oThis.channelTagNames.length !== newTagIdsToBeAssociated.length) {
      logger.log('Some tags are not present in db.\nPlease verify.');

      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 'a_s_a_c_e_foct_1',
          api_error_identifier: 'something_went_wrong',
          debug_options: {
            channelTagNames: oThis.channelTagNames,
            tagIds: newTagIdsToBeAssociated
          }
        })
      );
    }
  }

  /**
   * Get existing channel tag ids.
   *
   * @sets oThis.channelExistingTagIdsMap
   *
   * @returns {Promise<never>}
   * @private
   */
  async _getExistingChannelTagIds() {
    const oThis = this;

    const channelTagIdsCacheResponse = await new ChannelTagByChannelIdsCache({ channelIds: [oThis.channelId] }).fetch();
    if (channelTagIdsCacheResponse.isFailure()) {
      return Promise.reject(channelTagIdsCacheResponse);
    }

    const channelIds = channelTagIdsCacheResponse.data[oThis.channelId];
    for (let ci = 0; ci < channelIds.length; ci++) {
      oThis.channelExistingTagIdsMap[channelIds[ci]] = 1;
    }
  }

  /**
   * Update channel and clear respective cache.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _updateChannel() {
    const oThis = this;

    if (!CommonValidators.validateNonEmptyObject(oThis.toBeUpdatedInChannel)) {
      return;
    }

    // Update channels table.
    await new ChannelModel()
      .update(oThis.toBeUpdatedInChannel)
      .where({ id: oThis.channelId })
      .fire();

    await ChannelModel.flushCache({
      ids: [oThis.channelId],
      permalinks: [oThis.channelPermalink],
      name: oThis.channelName
    });
  }

  /**
   * Get updated channel object.
   *
   * @sets oThis.channel
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
