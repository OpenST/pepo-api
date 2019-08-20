/**
 * This module helps in adding video description.
 *
 * @module lib/video/AddDescription
 */

const rootPrefix = '../..',
  FilterTags = require(rootPrefix + '/lib/FilterOutTags'),
  FilterUrls = require(rootPrefix + '/lib/FilterOutUrls'),
  TextModel = require(rootPrefix + '/app/models/mysql/Text'),
  CommonValidator = require(rootPrefix + '/lib/validators/Common'),
  VideoTagsModel = require(rootPrefix + '/app/models/mysql/VideoTag'),
  VideoDetailsModel = require(rootPrefix + '/app/models/mysql/VideoDetail'),
  TextCacheKlass = require(rootPrefix + '/lib/cacheManagement/multi/TextsByIds'),
  VideoDetailsByVideoIds = require(rootPrefix + '/lib/cacheManagement/multi/VideoDetailsByVideoIds'),
  VideoDetailsByVideoIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/VideoDetailsByVideoIds'),
  textConstants = require(rootPrefix + '/lib/globalConstant/text');

class AddDescription {
  /**
   * @constructor
   *
   * @param params
   * @param {string} params.videoDescription - Description to insert
   * @param {number} params.videoId - Video id
   * @param {object} params.video - Video obj
   * @param {Boolean} params.flushCache
   */
  constructor(params) {
    const oThis = this;

    oThis.videoDescription = params.videoDescription;
    oThis.videoId = params.videoId;
    oThis.flushCache = CommonValidator.isVarNull(params.flushCache) ? 1 : params.flushCache;

    oThis.videoDetail = null;
  }

  /**
   * Perform
   *
   * @return {Promise<void>}
   */
  async perform() {
    const oThis = this,
      promiseArr = [];

    promiseArr.push(oThis._fetchVideoDetail());
    promiseArr.push(oThis._filterTags());
    promiseArr.push(oThis._filterUrls());

    await Promise.all(promiseArr);

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
   * @returns {Promise<void>}
   * @private
   */
  async _filterUrls() {
    const oThis = this;

    // Filter out urls from video description.
    const filterUrlsResp = await new FilterUrls(oThis.videoDescription).perform(),
      videoDescriptionUrlsData = filterUrlsResp.data;

    console.log('videoDescriptionUrlsDatal ======', videoDescriptionUrlsData);

    oThis.urlIds = videoDescriptionUrlsData.urlIds;
  }

  /**
   * Edit video description.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _editVideoDescription() {
    const oThis = this,
      promiseArray = [],
      bulkInsertVal = [];

    if (oThis.videoDetail.descriptionId && oThis.videoDescription) {
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

      // If new videoDescription is not added, then delete old ones.
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
   * Flush cache.
   *
   * @private
   */
  async _flushCache() {
    const oThis = this;

    if (oThis.videoDetail.descriptionId) {
      await new TextCacheKlass({ ids: [oThis.videoDetail.descriptionId] }).clear();
    }

    await new VideoDetailsByVideoIds({ videoIds: [oThis.videoId] }).clear();
    // ToDo: Flush video tags cache if required.
  }
}

module.exports = AddDescription;
