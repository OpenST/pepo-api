const rootPrefix = '../..',
  TextModel = require(rootPrefix + '/app/models/mysql/Text'),
  AddDescriptionBase = require(rootPrefix + '/lib/addDescription/Base'),
  VideoDetailModel = require(rootPrefix + '/app/models/mysql/VideoDetail'),
  IncrementWeightsAndAddVideoTags = require(rootPrefix + '/lib/video/IncrementWeightsAndAddVideoTags'),
  VideoDetailsByVideoIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/VideoDetailsByVideoIds'),
  webhookPreProcessorJobEnqueue = require(rootPrefix + '/lib/rabbitMqEnqueue/webhookPreProcessor'),
  webhookPreProcessorJobConstants = require(rootPrefix + '/lib/globalConstant/webhookPreProcessorJob'),
  videoTagConstants = require(rootPrefix + '/lib/globalConstant/videoTag');

/**
 * Class to add video description.
 *
 * @class AddVideoDescription
 */
class AddVideoDescription extends AddDescriptionBase {
  /**
   * Fetch video detail.
   *
   * @sets oThis.videoDetail
   *
   * @return {Promise<void>}
   * @private
   */
  async _fetchDetail() {
    const oThis = this;

    const videoDetailsCacheRsp = await new VideoDetailsByVideoIdsCache({ videoIds: [oThis.videoId] }).fetch();
    if (videoDetailsCacheRsp.isFailure()) {
      return Promise.reject(videoDetailsCacheRsp);
    }

    oThis.videoDetail = videoDetailsCacheRsp.data[oThis.videoId];
  }

  /**
   * Add video description if previous description was not present.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _addVideoDescription() {
    const oThis = this;

    await new VideoDetailModel()
      .update({ description_id: oThis.textId })
      .where({ video_id: oThis.videoId })
      .fire();
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
      await new IncrementWeightsAndAddVideoTags({
        tagIds: oThis.tagIds,
        videoId: oThis.videoId,
        kind: videoTagConstants.postKind
      }).perform();
    }
  }

  /**
   * Enqueue for Webhook Preprocessor.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _enqueueWebhookPreprocessor() {
    const oThis = this;
    if (oThis.isUserCreator) {
      await webhookPreProcessorJobEnqueue.enqueue(webhookPreProcessorJobConstants.videoUpdateTopic, {
        videoId: oThis.videoId,
        newUpload: 1,
        oldTagIds: []
      });
    }
  }

  /**
   * Fetch entity id.
   *
   * @sets oThis.entityId
   *
   * @returns {Promise<number>}
   * @private
   */
  async _fetchEntityId() {
    const oThis = this;

    oThis.entityId = oThis.videoId;
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
      VideoDetailModel.flushCache({ videoId: oThis.videoId, userId: oThis.videoDetail.creatorUserId })
    ];

    if (oThis.videoDetail.descriptionId) {
      promisesArray.push(TextModel.flushCache({ ids: [oThis.videoDetail.descriptionId] }));
    }

    await Promise.all(promisesArray);
  }
}

module.exports = AddVideoDescription;
