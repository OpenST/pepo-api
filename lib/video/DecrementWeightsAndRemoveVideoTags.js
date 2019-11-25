const rootPrefix = '../..',
  TagModel = require(rootPrefix + '/app/models/mysql/Tag'),
  VideoTagsModel = require(rootPrefix + '/app/models/mysql/VideoTag'),
  videoTagConstants = require(rootPrefix + '/lib/globalConstant/videoTag');

/**
 * Class to decrease weights and remove video tags.
 *
 * @class DecrementWeightsAndRemoveVideoTags
 */
class DecrementWeightsAndRemoveVideoTags {
  /**
   * Constructor to decrease weights and remove video tags.
   *
   * @param {object} params
   * @param {number} params.videoId: Video id
   * @param {boolean} params.tagIds
   * @param {string} params.kind
   *
   * @constructor
   */
  constructor(params) {
    const oThis = this;

    oThis.tagIds = params.tagIds;
    oThis.videoId = params.videoId;
    oThis.kind = params.kind;
  }

  /**
   * Perform.
   *
   * @return {Promise<void>}
   */
  async perform() {
    const oThis = this,
      promiseArray = [];

    promiseArray.push(oThis._decrementTagWeights());
    promiseArray.push(oThis._removeFromVideoTags());

    await Promise.all(promiseArray);
  }

  /**
   * Decrement tags
   *
   * @returns {Promise<void>}
   */
  async _decrementTagWeights() {
    const oThis = this;

    if (oThis.tagIds.length === 0) {
      return Promise.resolve();
    }
    if (oThis.kind === videoTagConstants.postKind) {
      await new TagModel().updateVideoTagWeights(oThis.tagIds, -1);
    } else if (oThis.kind === videoTagConstants.replyKind) {
      await new TagModel().updateReplyTagWeights(oThis.tagIds, -1);
    }

    await TagModel.flushCache({ ids: oThis.tagIds });
  }

  /**
   * Remove from video tags.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _removeFromVideoTags() {
    const oThis = this;

    if (oThis.tagIds.length > 0) {
      await new VideoTagsModel({})
        .delete()
        .where(['video_id = ? AND tag_id IN (?)', oThis.videoId, oThis.tagIds])
        .fire();
    }

    await VideoTagsModel.flushCache({ tagIds: oThis.tagIds });
  }
}

module.exports = DecrementWeightsAndRemoveVideoTags;
