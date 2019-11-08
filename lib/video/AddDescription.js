const rootPrefix = '../..',
  FilterTags = require(rootPrefix + '/lib/FilterOutTags'),
  FilterUrls = require(rootPrefix + '/lib/FilterOutUrls'),
  TextModel = require(rootPrefix + '/app/models/mysql/Text'),
  CommonValidator = require(rootPrefix + '/lib/validators/Common'),
  VideoDetailsModel = require(rootPrefix + '/app/models/mysql/VideoDetail'),
  TextIncludeModel = require(rootPrefix + '/app/models/cassandra/TextInclude'),
  textIncludeConstants = require(rootPrefix + '/lib/globalConstant/cassandra/textInclude'),
  TextByIdCache = require(rootPrefix + '/lib/cacheManagement/multi/TextsByIds'),
  VideoDetailsByVideoIds = require(rootPrefix + '/lib/cacheManagement/multi/VideoDetailsByVideoIds'),
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

    const promiseArray = [oThis._fetchVideoDetail(), oThis._filterTags(), oThis._filterUrls()];

    await Promise.all(promiseArray);

    let insertParams = {
      text: oThis.text,
      linkIds: oThis.urlIds,
      kind: textConstants.videoDescriptionKind
    };

    if (oThis.isUserCreator) {
      let tagIds = oThis.tagIds;

      insertParams.tagIds = tagIds;
      await new IncrementWeightsAndAddVideoTags({ tagIds: tagIds, videoId: oThis.videoId }).perform();
    }

    const textRow = await new TextModel().insertText(insertParams);
    oThis.textId = textRow.insertId;

    let entityIdentifiersArray = [];

    for (let i = 0; i < oThis.urlIds.length; i++) {
      entityIdentifiersArray.push(
        textIncludeConstants.createEntityIdentifier(
          textIncludeConstants.shortToLongNamesMapForEntityKind[textIncludeConstants.linkEntityKind],
          oThis.urlIds[i]
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
    const filterTagsResp = await new FilterTags(oThis.videoDescription).perform(),
      videoDescriptionTagsData = filterTagsResp.data;

    oThis.text = videoDescriptionTagsData.text;
    oThis.tagIds = videoDescriptionTagsData.tagIds;
  }

  /**
   * Filter urls.
   *
   * @sets oThis.urlIds
   *
   * @returns {Promise<void>}
   * @private
   */
  async _filterUrls() {
    const oThis = this;

    // Filter out urls from video description.
    const filterUrlsResp = await new FilterUrls({ text: oThis.videoDescription }).perform(),
      videoDescriptionUrlsData = filterUrlsResp.data;

    oThis.urlIds = videoDescriptionUrlsData.urlIds;
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
