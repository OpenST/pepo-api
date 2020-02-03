const rootPrefix = '../..',
  TagModel = require(rootPrefix + '/app/models/mysql/Tag'),
  VideoTagsModel = require(rootPrefix + '/app/models/mysql/VideoTag'),
  videoTagConstants = require(rootPrefix + '/lib/globalConstant/videoTag'),
  ChannelVideoTagDelegator = require(rootPrefix + '/lib/channelTagVideo/Delegator');

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
   * Main performer for class.
   *
   * @returns {Promise<void>}
   */
  async perform() {
    const oThis = this;

    const promiseArray = [oThis._incrementTagWeights(), oThis._insertInVideoTags(), oThis._associateToChannels()];
    await Promise.all(promiseArray);
  }

  /**
   * Increment tags.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _incrementTagWeights() {
    const oThis = this;

    if (oThis.tagIds.length === 0) {
      return;
    }

    if (oThis.kind === videoTagConstants.postKind) {
      await new TagModel().updateVideoTagWeights(oThis.tagIds, 1);
    } else if (oThis.kind === videoTagConstants.replyKind) {
      await new TagModel().updateReplyTagWeights(oThis.tagIds, 1);
    }

    return TagModel.flushCache({ ids: oThis.tagIds });
  }

  /**
   * Insert in video tags.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _insertInVideoTags() {
    const oThis = this;

    const bulkInsertVal = [];

    for (let index = 0; index < oThis.tagIds.length; index++) {
      bulkInsertVal.push([oThis.tagIds[index], oThis.videoId, videoTagConstants.invertedKinds[oThis.kind]]);
    }

    if (oThis.tagIds.length > 0) {
      await new VideoTagsModel({})
        .insertMultiple(['tag_id', 'video_id', 'video_kind'], bulkInsertVal, { touch: true })
        .onDuplicate({ video_id: oThis.videoId })
        .fire();
    }

    return VideoTagsModel.flushCache({ tagIds: oThis.tagIds });
  }

  /**
   * Associate channels
   *
   * @returns {Promise<void>}
   * @private
   */
  async _associateToChannels() {
    const oThis = this;

    if (oThis.tagIds.length === 0) {
      return;
    }

    await new ChannelVideoTagDelegator({
      videoIds: [oThis.videoId],
      tagIds: oThis.tagIds,
      isAddInChannelTagVideo: true
    }).perform();
  }
}

module.exports = IncrementWeightAndVideoTags;
