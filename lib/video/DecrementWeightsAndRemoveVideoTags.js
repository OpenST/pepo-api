const rootPrefix = '../..',
  TagModel = require(rootPrefix + '/app/models/mysql/Tag'),
  VideoTagsModel = require(rootPrefix + '/app/models/mysql/VideoTag'),
  ChannelVideoTagDelegator = require(rootPrefix + '/lib/channelTagVideo/Delegator'),
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
   * Main performer for class.
   *
   * @returns {Promise<void>}
   */
  async perform() {
    const oThis = this;

    const promiseArray = [
      oThis._decrementTagWeights(),
      oThis._removeFromVideoTags(),
      oThis._disassociateFromChannels()
    ];
    await Promise.all(promiseArray);
  }

  /**
   * Decrement tags
   *
   * @returns {Promise<void>}
   * @private
   */
  async _decrementTagWeights() {
    const oThis = this;

    if (oThis.tagIds.length === 0) {
      return;
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

  /**
   * Disassociate channels
   *
   * @returns {Promise<void>}
   * @private
   */
  async _disassociateFromChannels() {
    const oThis = this;

    if (oThis.tagIds.length === 0 || oThis.kind === videoTagConstants.replyKind) {
      return;
    }

    await new ChannelVideoTagDelegator({
      videoIds: [oThis.videoId],
      tagIds: oThis.tagIds,
      isAddInChannelTagVideo: false
    }).perform();
  }
}

module.exports = DecrementWeightsAndRemoveVideoTags;
