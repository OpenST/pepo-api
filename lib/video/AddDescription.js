const rootPrefix = '../..',
  FilterTags = require(rootPrefix + '/lib/FilterOutTags'),
  FilterUrls = require(rootPrefix + '/lib/FilterOutUrls'),
  TagModel = require(rootPrefix + '/app/models/mysql/Tag'),
  TextModel = require(rootPrefix + '/app/models/mysql/Text'),
  CommonValidator = require(rootPrefix + '/lib/validators/Common'),
  VideoTagsModel = require(rootPrefix + '/app/models/mysql/VideoTag'),
  VideoDetailsModel = require(rootPrefix + '/app/models/mysql/VideoDetail'),
  TextCacheKlass = require(rootPrefix + '/lib/cacheManagement/multi/TextsByIds'),
  VideoDetailsByVideoIds = require(rootPrefix + '/lib/cacheManagement/multi/VideoDetailsByVideoIds'),
  VideoDetailsByVideoIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/VideoDetailsByVideoIds'),
  basicHelper = require(rootPrefix + '/helpers/basic'),
  textConstants = require(rootPrefix + '/lib/globalConstant/text');

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

    const promiseArray = [oThis._fetchVideoDetail(), oThis._filterTags(), oThis._filterUrls()];
    await Promise.all(promiseArray);

    await oThis._fetchExistingTagIds();

    oThis._segregateTagIds();

    await oThis._modifyVideoWeights();

    // If user has added video description before then only update text.
    await oThis._editVideoDescription();

    // If new videoDescription is not added then delete text.
    await oThis._deleteVideoDescription();

    // If new videoDescription is added then insert in 2 tables.
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
   * Fetch existing tag ids.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _fetchExistingTagIds() {
    const oThis = this;

    if (oThis.videoDetail && oThis.videoDetail.descriptionId) {
      let queryRsp = await new TextModel().fetchById(oThis.videoDetail.descriptionId);
      oThis.oldTagIds = queryRsp.tagIds;
    }
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
   * This function segregates tags ids whose weight is to be added or removed.
   *
   * @private
   */
  _segregateTagIds() {
    const oThis = this;

    oThis.weightIncrementTagIds = basicHelper.arrayDiff(oThis.tagIds, oThis.oldTagIds);
    oThis.weightDecrementTagIds = basicHelper.arrayDiff(oThis.oldTagIds, oThis.tagIds);
  }

  /**
   * Modifies video weights
   *
   * @returns {Promise<void>}
   * @private
   */
  async _modifyVideoWeights() {
    const oThis = this;

    let promiseArray = [];

    promiseArray.push(oThis.incrementTagWeights());
    promiseArray.push(oThis.decrementTagWeights());

    await Promise.all(promiseArray);

    let allTagIds = [...new Set(oThis.weightIncrementTagIds.concat(oThis.weightDecrementTagIds))];
    await TagModel.flushCache({ ids: allTagIds });
  }

  /**
   * Increment tags
   *
   * @returns {Promise<void>}
   */
  async incrementTagWeights() {
    const oThis = this;

    await new TagModel().updateVideoTagWeights(oThis.weightIncrementTagIds, 1);
  }

  /**
   * Decrement tags
   *
   * @returns {Promise<void>}
   */
  async decrementTagWeights() {
    const oThis = this;

    await new TagModel().updateVideoTagWeights(oThis.weightDecrementTagIds, -1);
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
    const filterUrlsResp = await new FilterUrls(oThis.videoDescription).perform(),
      videoDescriptionUrlsData = filterUrlsResp.data;

    oThis.urlIds = videoDescriptionUrlsData.urlIds;
  }

  /**
   * Edit video description.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _editVideoDescription() {
    const oThis = this;

    if (oThis.videoDetail.descriptionId && oThis.videoDescription) {
      const promiseArray = [],
        bulkInsertVal = [];

      // If new videoDescription is added then update in text.
      promiseArray.push(
        new TextModel({}).updateById({
          id: oThis.videoDetail.descriptionId,
          text: oThis.text,
          tagIds: oThis.tagIds,
          linkIds: oThis.urlIds
        })
      );

      for (let index = 0; index < oThis.tagIds.length; index++) {
        bulkInsertVal.push([oThis.tagIds[index], oThis.videoId]);
      }

      promiseArray.push(
        new VideoTagsModel({})
          .insertMultiple(['tag_id', 'video_id'], bulkInsertVal, { touch: true })
          .onDuplicate({ video_id: oThis.videoId })
          .fire()
      );

      await Promise.all(promiseArray);
    }
  }

  /**
   * Delete video description related entries if video description is updated and is null now.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _deleteVideoDescription() {
    const oThis = this;

    if (oThis.videoDetail.descriptionId && !oThis.videoDescription) {
      const promiseArray = [];

      // If new videoDescription is not added, then delete old ones.Todo: Make only description id as null.
      promiseArray.push(new VideoDetailsModel().deleteById({ id: oThis.videoDetail.descriptionId }));

      // Delete old text.
      promiseArray.push(new TextModel({}).deleteById({ id: oThis.videoDetail.descriptionId }));

      // Delete old video tags association.
      promiseArray.push(new VideoTagsModel({}).deleteByVideoId({ videoId: oThis.videoId }));

      await Promise.all(promiseArray);
    }
  }

  /**
   * Add video description if previous description was not present.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _addVideoDescription() {
    const oThis = this;

    if (!oThis.videoDetail.descriptionId && oThis.videoDescription) {
      const promiseArray = [],
        bulkInsertVal = [];

      // If new videoDescription is added then insert in 2 tables.
      const textRow = await new TextModel().insertText({
        text: oThis.text,
        tagIds: oThis.tagIds,
        linkIds: oThis.urlIds,
        kind: textConstants.videoDescriptionKind
      });

      if (textRow) {
        const textId = textRow.insertId;

        promiseArray.push(
          new VideoDetailsModel()
            .update({ description_id: textId })
            .where({ video_id: oThis.videoId })
            .fire()
        );
      }

      for (let index = 0; index < oThis.tagIds.length; index++) {
        bulkInsertVal.push([oThis.tagIds[index], oThis.videoId]);
      }

      if (oThis.tagIds.length > 0) {
        promiseArray.push(
          new VideoTagsModel({})
            .insertMultiple(['tag_id', 'video_id'], bulkInsertVal, { touch: true })
            .onDuplicate({ video_id: oThis.videoId })
            .fire()
        );
      }

      await Promise.all(promiseArray);
    }
  }

  /**
   * Flush cache.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _flushCache() {
    const oThis = this;

    const promisesArray = [new VideoDetailsByVideoIds({ videoIds: [oThis.videoId] }).clear()];

    if (oThis.videoDetail.descriptionId) {
      promisesArray.push(new TextCacheKlass({ ids: [oThis.videoDetail.descriptionId] }).clear());
    }

    await Promise.all(promisesArray);
    // ToDo: Flush video tags cache if required.
  }
}

module.exports = AddDescription;
