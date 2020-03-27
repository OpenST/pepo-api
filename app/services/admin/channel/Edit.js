const rootPrefix = '../../../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  FilterTags = require(rootPrefix + '/lib/FilterOutTags'),
  TextModel = require(rootPrefix + '/app/models/mysql/Text'),
  FilterOutLinks = require(rootPrefix + '/lib/FilterOutLinks'),
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  ChannelModel = require(rootPrefix + '/app/models/mysql/channel/Channel'),
  ChannelStatModel = require(rootPrefix + '/app/models/mysql/channel/ChannelStat'),
  ChannelByIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/channel/ChannelByIds'),
  ChannelByPermalinksCache = require(rootPrefix + '/lib/cacheManagement/multi/channel/ChannelByPermalinks'),
  imageLib = require(rootPrefix + '/lib/imageLib'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  textConstants = require(rootPrefix + '/lib/globalConstant/text'),
  imageConstants = require(rootPrefix + '/lib/globalConstant/image'),
  channelConstants = require(rootPrefix + '/lib/globalConstant/channel/channels');

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
   * @param {string} params.name
   * @param {string} params.description
   * @param {string} params.tagline
   * @param {string} params.permalink
   * @param {string[]} params.tags
   * @param {string[]} params.admins
   * @param {string} params.original_image
   * @param {string} params.share_image
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
    oThis.channelAdmins = params.admins;
    oThis.channelTags = params.tags;
    oThis.originalImageUrl = params.original_image;
    oThis.shareImageUrl = params.share_image;

    oThis.channelId = null;
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

    await oThis._validateAndSanitize();

    if (!oThis.isEdit) {
      await oThis._createNewChannel();
    }

    await Promise.all([
      oThis._performChannelTaglineRelatedTasks(),
      oThis._performChannelDescriptionRelatedTasks(),
      oThis._performImageUrlRelatedTasks(),
      oThis._performShareImageUrlRelatedTasks(),
      oThis._createEntryInChannelStats()
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
          api_error_identifier: 'entity_not_found', // TODO: @Kiran - update this.
          debug_options: {
            channelPermalink: oThis.channelPermalink,
            isEdit: oThis.isEdit
          }
        })
      );
    }

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
          api_error_identifier: 'entity_not_found', // TODO: @Kiran - update this.
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
          api_error_identifier: 'entity_not_found', // TODO: @Kiran - update this.
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
          internal_error_identifier: 'a_s_a_c_e_pcdrt_1',
          api_error_identifier: 'entity_not_found', // TODO: @Kiran - update this.
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
          internal_error_identifier: 'a_s_a_c_e_pcdrt_1',
          api_error_identifier: 'entity_not_found', // TODO: @Kiran - update this.
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
}

module.exports = EditChannel;
