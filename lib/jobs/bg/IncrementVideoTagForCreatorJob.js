const rootPrefix = '../../..',
  FilterTags = require(rootPrefix + '/lib/FilterOutTags'),
  TextModel = require(rootPrefix + '/app/models/mysql/Text'),
  VideoDetailsModel = require(rootPrefix + '/app/models/mysql/VideoDetail'),
  IncrementWeightsAndAddVideoTags = require(rootPrefix + '/lib/video/IncrementWeightsAndAddVideoTags');

/**
 * Class to increase weights and add video tags for whitelisted creator for all videos.
 *
 * @class IncrementVideoTagForCreatorJob
 */
class IncrementVideoTagForCreatorJob {
  /**
   * Constructor to increase weights and add video tags for whitelisted creator for all videos.
   *
   * @param {object} params
   * @param {number} params.videoIds: Video id
   *
   * @constructor
   */
  constructor(params) {
    const oThis = this;

    oThis.videoIds = params.videoIds;
  }

  /**
   * Perform.
   *
   * @return {Promise<void>}
   */
  async perform() {
    const oThis = this,
      promiseArray = [];

    oThis.videoDetails = await new VideoDetailsModel().fetchByVideoIds(oThis.videoIds);

    for (let i = 0; i < oThis.videoIds.length; i++) {
      promiseArray.push(oThis._performActionForEachVideo(oThis.videoIds[i]));
    }

    await Promise.all(promiseArray);
  }

  /**
   * Perform action for each video.
   *
   * @param videoId
   * @returns {Promise<void>}
   * @private
   */
  async _performActionForEachVideo(videoId) {
    const oThis = this;

    let descriptionId = oThis.videoDetails[videoId].descriptionId;

    if (!descriptionId) {
      return Promise.resolve();
    }

    let text = await oThis._fetchText(descriptionId);

    const filterTagsResp = await new FilterTags(text).perform(),
      videoDescriptionTagsData = filterTagsResp.data,
      tagIds = videoDescriptionTagsData.tagIds;

    if (tagIds.length === 0) {
      return Promise.resolve();
    }

    await new IncrementWeightsAndAddVideoTags({ tagIds: tagIds, videoId: videoId }).perform();

    return Promise.resolve();
  }

  /**
   * Fetch text.
   *
   * @param textId
   * @returns {Promise<*>}
   * @private
   */
  async _fetchText(textId) {
    const oThis = this;

    let textDetails = await new TextModel().fetchById(textId);

    return textDetails.text;
  }
}

module.exports = IncrementVideoTagForCreatorJob;
