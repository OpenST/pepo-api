const rootPrefix = '../..',
  TagModel = require(rootPrefix + '/app/models/mysql/Tag'),
  VideoTagsModel = require(rootPrefix + '/app/models/mysql/VideoTag');

/**
 * Class to increase weights and add video tags.
 *
 * @class IncrementWeightAndVideoTags
 */
class IncrementWeightAndVideoTags {
  /**
   * Constructor to increase weights and add video tags.
   *
   * @param {object} params
   * @param {number} params.videoId: Video id
   * @param {boolean} params.tagIds
   *
   * @constructor
   */
  constructor(params) {
    const oThis = this;

    oThis.tagIds = params.tagIds;
    oThis.videoId = params.videoId;
  }

  /**
   * Perform.
   *
   * @return {Promise<void>}
   */
  async perform() {
    const oThis = this,
      promiseArray = [];

    promiseArray.push(oThis._incrementTagWeights());
    promiseArray.push(oThis._insertInVideoTags());

    await Promise.all(promiseArray);
  }

  /**
   * Increment tags
   *
   * @returns {Promise<void>}
   */
  async _incrementTagWeights() {
    const oThis = this;

    if (oThis.tagIds.length === 0) {
      return Promise.resolve();
    }
    await new TagModel().updateVideoTagWeights(oThis.tagIds, 1);

    await TagModel.flushCache({ ids: oThis.tagIds });
  }

  /**
   * Insert in video tags.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _insertInVideoTags() {
    const oThis = this,
      bulkInsertVal = [];

    for (let index = 0; index < oThis.tagIds.length; index++) {
      bulkInsertVal.push([oThis.tagIds[index], oThis.videoId]);
    }

    if (oThis.tagIds.length > 0) {
      await new VideoTagsModel({})
        .insertMultiple(['tag_id', 'video_id'], bulkInsertVal, { touch: true })
        .onDuplicate({ video_id: oThis.videoId })
        .fire();
    }

    await VideoTagsModel.flushCache({ tagIds: oThis.tagIds });
  }
}

module.exports = IncrementWeightAndVideoTags;
