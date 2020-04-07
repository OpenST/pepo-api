const rootPrefix = '../..',
  FilterTags = require(rootPrefix + '/lib/FilterOutTags'),
  TagModel = require(rootPrefix + '/app/models/mysql/Tag'),
  TextModel = require(rootPrefix + '/app/models/mysql/Text'),
  FilterOutLinks = require(rootPrefix + '/lib/FilterOutLinks'),
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  ChannelModel = require(rootPrefix + '/app/models/mysql/channel/Channel'),
  AddInChannelLib = require(rootPrefix + '/lib/channelTagVideo/AddTagInChannel'),
  ChannelUserModel = require(rootPrefix + '/app/models/mysql/channel/ChannelUser'),
  ChangeChannelUserRoleLib = require(rootPrefix + '/lib/channel/ChangeChannelUserRole'),
  RemoveTagFromChannelLib = require(rootPrefix + '/lib/channelTagVideo/RemoveTagFromChannel'),
  ChannelByIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/channel/ChannelByIds'),
  ChannelTagByChannelIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/channel/ChannelTagByChannelIds'),
  imageLib = require(rootPrefix + '/lib/imageLib'),
  tagConstants = require(rootPrefix + '/lib/globalConstant/tag'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  textConstants = require(rootPrefix + '/lib/globalConstant/text'),
  imageConstants = require(rootPrefix + '/lib/globalConstant/image'),
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

    await oThis._updateChannelName();
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
   * Update channel name.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _updateChannelName() {
    // TODO - channel_create - we should put name in oThis.toBeUpdatedInChannel and update later.
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

    if (oThis.channelAdminUserIds.length === 0) {
      return;
    }

    const adminUserIdsToAssociate = [];
    const adminUserIdsToDisassociate = [];

    // Fetch existing admins of a channel.
    const channelAdminIds = await new ChannelUserModel().fetchAdminProfilesByChannelId(oThis.channelId);
    const existingAdminsMap = {};
    for (let index = 0; index < channelAdminIds.length; index++) {
      existingAdminsMap[channelAdminIds[index]] = 1;
    }

    const newAdminsMap = {};
    for (let index = 0; index < oThis.channelAdminUserIds.length; index++) {
      newAdminsMap[oThis.channelAdminUserIds[index]] = 1;
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
    const oThis = this,
      channelNamesPresentMap = {},
      sanitizedChannelNames = [];

    if (oThis.channelTagNames.length === 0) {
      return;
    }

    for (let index = 0; index < oThis.channelTagNames.length; index++) {
      const sanitizedChannelName = oThis.channelTagNames[index].trim();
      if (channelNamesPresentMap[channelNamesPresentMap]) {
        continue;
      }
      sanitizedChannelNames.push(sanitizedChannelName);
      channelNamesPresentMap[channelNamesPresentMap] = 1;
    }
    oThis.channelTagNames = sanitizedChannelNames;

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
