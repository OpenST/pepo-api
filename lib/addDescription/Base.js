const rootPrefix = '../..',
  FilterTags = require(rootPrefix + '/lib/FilterOutTags'),
  FilterAtMentions = require(rootPrefix + '/lib/FilterOutAtMentions'),
  TextModel = require(rootPrefix + '/app/models/mysql/Text'),
  CommonValidator = require(rootPrefix + '/lib/validators/Common'),
  TextIncludeModel = require(rootPrefix + '/app/models/cassandra/TextInclude'),
  textIncludeConstants = require(rootPrefix + '/lib/globalConstant/cassandra/textInclude'),
  IncrementWeightsAndAddVideoTags = require(rootPrefix + '/lib/video/IncrementWeightsAndAddVideoTags'),
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
    oThis.flushCache = CommonValidator.isVarNull(params.flushCache) ? 1 : params.flushCache;
    oThis.isUserCreator = params.isUserCreator;

    oThis.videoDetail = null;
    oThis.text = null;
    oThis.tagIds = null;

    oThis.tagIdToTagNameMap = {};
    oThis.oldTagIds = [];
    oThis.weightIncrementTagIds = [];
    oThis.weightDecrementTagIds = [];
    oThis.userNamesWithPrefix = [];
    oThis.userNamesToUserIdMap = {};
  }

  /**
   * Perform.
   *
   * @return {Promise<void>}
   */
  async perform() {
    const oThis = this;

    // If video description is not present, then nothing to do.
    if (!oThis.videoDescription) {
      return responseHelper.successWithData({});
    }

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

    // TODO @dhananjay - publish notification and activity for at-mentioned users.

    await oThis._flushCache();

    return responseHelper.successWithData({
      descriptionId: oThis.textId
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
   * Filter tags.
   *
   * @sets oThis.text, oThis.tagIds
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
    oThis.tagIdToTagNameMap = videoDescriptionTagsData.tagIdToTagNameMap;
  }

  /**
   * Filter at mentions.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _filterAtMentions() {
    const oThis = this;

    // Filter out at mentions from video description.
    const filterMentionsResp = await new FilterAtMentions(oThis.videoDescription, oThis.textId).perform(),
      videoDescriptionAtMentionsData = filterMentionsResp.data;

    oThis.userNamesWithPrefix = videoDescriptionAtMentionsData.userNamesWithPrefix;
    oThis.userNamesToUserIdMap = videoDescriptionAtMentionsData.userNamesToUserIdMap;
  }

  /**
   * Increment weights and add video tags.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _incrementTags() {
    const oThis = this;

    if (oThis.isUserCreator) {
      await new IncrementWeightsAndAddVideoTags({ tagIds: oThis.tagIds, videoId: oThis.videoId }).perform();
    }
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
