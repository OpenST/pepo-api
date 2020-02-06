const rootPrefix = '../..',
  FilterTags = require(rootPrefix + '/lib/FilterOutTags'),
  TextModel = require(rootPrefix + '/app/models/mysql/Text'),
  FilterAtMentions = require(rootPrefix + '/lib/FilterAtMentions'),
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  textConstants = require(rootPrefix + '/lib/globalConstant/text'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

/**
 * Class to add description base.
 *
 * @class AddDescriptionBase
 */
class AddDescriptionBase {
  /**
   * Constructor to add description.
   *
   * @param {object} params
   * @param {string} params.videoDescription: Description to insert
   * @param {number} params.videoId: Video id
   * @param {number} params.isUserCreator
   * @param {boolean} params.flushCache
   *
   * @constructor
   */
  constructor(params) {
    const oThis = this;

    oThis.videoDescription = params.videoDescription;
    oThis.videoId = params.videoId;
    oThis.flushCache = CommonValidators.isVarNull(params.flushCache) ? 1 : params.flushCache;
    oThis.isUserCreator = params.isUserCreator;

    oThis.videoDetail = null;
    oThis.entityId = null;
    oThis.text = null;
    oThis.tagIds = null;

    oThis.tagIdToTagNamesMap = {};
    oThis.oldTagIds = [];
    oThis.weightIncrementTagIds = [];
    oThis.weightDecrementTagIds = [];
    oThis.mentionedUserIds = [];
    oThis.textId = null;
  }

  /**
   * Perform.
   *
   * @sets oThis.textId
   *
   * @returns {Promise<void>}
   */
  async perform() {
    const oThis = this;

    // If video description is not present, then nothing to do.
    if (oThis.videoDescription) {
      await oThis._fetchDetail();

      const insertParams = {
        text: oThis.videoDescription,
        kind: textConstants.videoDescriptionKind
      };

      const textRow = await new TextModel().insertText(insertParams);
      oThis.textId = textRow.insertId;

      await oThis._filterAtMentions();

      await oThis._filterTags();

      await oThis._incrementTags();

      await oThis._addVideoDescription();

      await oThis._flushCache();
    }

    await oThis._enqueueWebhookPreprocessor();

    return responseHelper.successWithData({
      descriptionId: oThis.textId,
      mentionedUserIds: oThis.mentionedUserIds
    });
  }

  /**
   * Fetch details.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _fetchDetail() {
    throw new Error('Sub-class to implement.');
  }

  /**
   * Enqueue for Webhook Preprocessor.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _enqueueWebhookPreprocessor() {
    throw new Error('Sub-class to implement.');
  }

  /**
   * Filter tags.
   *
   * @sets oThis.text, oThis.tagIds, oThis.tagIdToTagNameMap
   *
   * @returns {Promise<void>}
   * @private
   */
  async _filterTags() {
    const oThis = this;

    // Filter out tags from video description.
    const filterTagsResp = await new FilterTags(oThis.videoDescription, oThis.textId).perform(),
      videoDescriptionTagsData = filterTagsResp.data;

    oThis.text = videoDescriptionTagsData.text;
    oThis.tagIds = videoDescriptionTagsData.tagIds;
    oThis.tagIdToTagNamesMap = videoDescriptionTagsData.tagIdToTagNamesMap;
  }

  /**
   * Filter at mentions.
   *
   * @sets oThis.mentionedUserIds
   *
   * @returns {Promise<void>}
   * @private
   */
  async _filterAtMentions() {
    const oThis = this;

    await oThis._fetchEntityId();

    // Filter out at mentions from video description.
    const filterMentionsResp = await new FilterAtMentions({
        text: oThis.videoDescription,
        textId: oThis.textId
      }).perform(),
      videoDescriptionAtMentionsData = filterMentionsResp.data;

    oThis.mentionedUserIds = videoDescriptionAtMentionsData.mentionedUserIds;
  }

  /**
   * Add video description if previous description was not present.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _addVideoDescription() {
    throw new Error('Sub-class to implement.');
  }

  /**
   * Increment tags.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _incrementTags() {
    throw new Error('Sub-class to implement.');
  }

  /**
   * Fetch entity id.
   *
   * @returns {Promise}
   * @private
   */
  async _fetchEntityId() {
    throw new Error('Sub-class to implement.');
  }

  /**
   * Flush cache.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _flushCache() {
    throw new Error('Sub-class to implement.');
  }
}

module.exports = AddDescriptionBase;
