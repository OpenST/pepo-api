const rootPrefix = '../../../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  FilterTags = require(rootPrefix + '/lib/FilterOutTags'),
  TextModel = require(rootPrefix + '/app/models/mysql/Text'),
  FilterOutLinks = require(rootPrefix + '/lib/FilterOutLinks'),
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  ChannelModel = require(rootPrefix + '/app/models/mysql/channel/Channel'),
  ChannelByIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/channel/ChannelByIds'),
  ChannelByPermalinksCache = require(rootPrefix + '/lib/cacheManagement/multi/channel/ChannelByPermalinks'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  textConstants = require(rootPrefix + '/lib/globalConstant/text'),
  imageConstants = require(rootPrefix + '/lib/globalConstant/image'),
  entityTypeConstants = require(rootPrefix + '/lib/globalConstant/entityType'),
  channelConstants = require(rootPrefix + '/lib/globalConstant/channel/channels');

// Declare constants.
const ORIGIN_IMAGE_WIDTH = 1500;
const ORIGIN_IMAGE_HEIGHT = 642;
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
   * @param {number} params.isEdit
   * @param {string} params.name
   * @param {string} params.description
   * @param {string} params.tagLine
   * @param {string} params.permalink
   * @param {string[]} params.tags
   * @param {string[]} params.admins
   * @param {string} params.originalImage
   * @param {string} params.shareImage
   *
   * @augments ServiceBase
   *
   * @constructor
   */
  constructor(params) {
    super(params);

    const oThis = this;

    oThis.isEdit = params.isEdit;
    oThis.channelName = params.name;
    oThis.channelDescription = params.description;
    oThis.channelTagLine = params.tagline;
    oThis.channelPermalink = params.permalink;
    oThis.channelAdmins = params.admins;
    oThis.channelTags = params.tags;
    oThis.originalImage = params.originalImage;
    oThis.shareImage = params.shareImage;

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

    if (oThis.isEdit) {
    } else {
      await oThis._createNewChannel();
    }
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

    if (
      (!oThis.isEdit && !oThis.channelTagLine) ||
      (oThis.channelTagLine && !oThis.isEdit) ||
      (!oThis.channelTagLine && oThis.isEdit)
    ) {
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

    if (oThis.channelDescription) {
      if (!oThis.isEdit) {
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
}

module.exports = EditChannel;
