const rootPrefix = '../..',
  FilterTags = require(rootPrefix + '/lib/FilterOutTags'),
  FilterAtMentions = require(rootPrefix + '/lib/FilterOutAtMentions'),
  TextModel = require(rootPrefix + '/app/models/mysql/Text'),
  CommonValidator = require(rootPrefix + '/lib/validators/Common'),
  VideoDetailsModel = require(rootPrefix + '/app/models/mysql/VideoDetail'),
  TextIncludeModel = require(rootPrefix + '/app/models/cassandra/TextInclude'),
  textIncludeConstants = require(rootPrefix + '/lib/globalConstant/cassandra/textInclude'),
  IncrementWeightsAndAddVideoTags = require(rootPrefix + '/lib/video/IncrementWeightsAndAddVideoTags'),
  VideoDetailsByVideoIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/VideoDetailsByVideoIds'),
  textConstants = require(rootPrefix + '/lib/globalConstant/text'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

/**
 * Class to add video description.
 *
 * @class AddDescription
 */
class AddDescription {
  /**
   * Constructor to add video description.
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
    oThis.urlIds = null;

    oThis.tagIdToTagNameMap = {};
    oThis.oldTagIds = [];
    oThis.weightIncrementTagIds = [];
    oThis.weightDecrementTagIds = [];
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

    await oThis._fetchVideoDetail();

    await oThis._filterAtMentions();
    const insertParams = {
      text: oThis.text,
      kind: textConstants.videoDescriptionKind
    };

    const textRow = await new TextModel().insertText(insertParams);
    oThis.textId = textRow.insertId;

    await oThis._filterTags();

    if (oThis.isUserCreator) {
      await new IncrementWeightsAndAddVideoTags({ tagIds: oThis.tagIds, videoId: oThis.videoId }).perform();
    }

    const entityIdentifiersArray = [];

    for (let ind = 0; ind < oThis.urlIds.length; ind++) {
      entityIdentifiersArray.push(
        textIncludeConstants.createEntityIdentifier(
          textIncludeConstants.shortToLongNamesMapForEntityKind[textIncludeConstants.linkEntityKind],
          oThis.urlIds[ind]
        )
      );
    }

    await TextIncludeModel().insertInTextIncludes(oThis.textId, entityIdentifiersArray, oThis.text);

    await oThis._addVideoDescription();

    await oThis._flushCache();
  }

  /**
   * Fetch video detail.
   *
   * @sets oThis.videoDetail
   *
   * @return {Promise<void>}
   * @private
   */
  async _fetchVideoDetail() {
    const oThis = this;

    const videoDetailsCacheRsp = await new VideoDetailsByVideoIdsCache({ videoIds: [oThis.videoId] }).fetch();

    if (videoDetailsCacheRsp.isFailure()) {
      return Promise.reject(videoDetailsCacheRsp);
    }

    oThis.videoDetail = videoDetailsCacheRsp.data[oThis.videoId];
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
    const filterUrlsResp = await new FilterAtMentions(oThis.videoDescription).perform(),
      videoDescriptionAtMentionsData = filterUrlsResp.data;

    oThis.mentionedNames = videoDescriptionAtMentionsData.mentionedNames;
    oThis.userNames = videoDescriptionAtMentionsData.userNames;
  }

  /**
   * Add video description if previous description was not present.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _addVideoDescription() {
    const oThis = this;

    await new VideoDetailsModel()
      .update({ description_id: oThis.textId })
      .where({ video_id: oThis.videoId })
      .fire();
  }

  /**
   * Flush cache.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _flushCache() {
    const oThis = this;

    const promisesArray = [
      VideoDetailsModel.flushCache({ videoId: oThis.videoId, userId: oThis.videoDetail.creatorUserId })
    ];

    if (oThis.videoDetail.descriptionId) {
      promisesArray.push(TextModel.flushCache({ textIds: [oThis.videoDetail.descriptionId] }));
    }

    await Promise.all(promisesArray);
  }
}

module.exports = AddDescription;
