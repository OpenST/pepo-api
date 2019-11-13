const rootPrefix = '../..',
  TextModel = require(rootPrefix + '/app/models/mysql/Text'),
  AddDescriptionBase = require(rootPrefix + '/lib/addDescription/Base'),
  VideoDetailsModel = require(rootPrefix + '/app/models/mysql/VideoDetail'),
  VideoDetailsByVideoIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/VideoDetailsByVideoIds');

/**
 * Class to add video description.
 *
 * @class AddVideoDescription
 */
class AddVideoDescription extends AddDescriptionBase {
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
    super(params);
  }

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

    await new VideoDetailsModel()
      .update({ description_id: oThis.textId })
      .where({ video_id: oThis.videoId })
      .fire();
  }

  /**
   * Fetch entity id
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
      VideoDetailsModel.flushCache({ videoId: oThis.videoId, userId: oThis.videoDetail.creatorUserId })
    ];

    if (oThis.videoDetail.descriptionId) {
      promisesArray.push(TextModel.flushCache({ textIds: [oThis.videoDetail.descriptionId] }));
    }

    await Promise.all(promisesArray);
  }
}

module.exports = AddVideoDescription;
