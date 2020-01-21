const rootPrefix = '../../../../..',
  basicHelper = require(rootPrefix + '/helpers/basic'),
  coreConstants = require(rootPrefix + '/config/coreConstants'),
  gotoConstants = require(rootPrefix + '/lib/globalConstant/goto');

/**
 * Class for webhook event video entity formatter.
 *
 * @class Video
 */
class Video {
  /**
   * Constructor for webhook event video entity formatter.
   *
   * @param {object} params
   * @param {array<number>} params.videoIds
   * @param {object} params.videos
   * @param {object} params.videoDetails
   * @param {object} params.texts
   * @param {object} params.images
   *
   * @constructor
   */
  constructor(params) {
    const oThis = this;

    oThis.videoIds = params.videoIds;
    oThis.videos = params.videos;
    oThis.videoDetails = params.videoDetails;
    oThis.texts = params.texts;
    oThis.images = params.images;
  }

  /**
   * Main performer for class.
   *
   * @returns {{}}
   */
  perform() {
    const oThis = this;

    const finalResponse = {};

    for (let index = 0; index < oThis.videoIds.length; index++) {
      const videoId = oThis.videoIds[index];
      finalResponse[videoId] = {
        id: videoId,
        creator_id: '',
        url: '',
        video_url: '',
        total_contributors: 0,
        total_contribution_amount: 0,
        description: '',
        image_url: '',
        status: ''
      };

      const videoData = oThis.videos[videoId];
      finalResponse[videoId].url = oThis._generateVideoShareUrl(videoId);
      finalResponse[videoId].video_url = videoData.resolutions.external.url;

      const videoDetails = oThis.videoDetails[videoId];
      const descriptionId = videoDetails.descriptionId;
      const posterImageId = videoData.posterImageId;

      finalResponse[videoId].creator_id = videoDetails.creatorUserId;
      finalResponse[videoId].total_contributors = Number(videoDetails.totalContributedBy || 0);
      finalResponse[videoId].total_contribution_amount = basicHelper
        .convertWeiToNormal(videoDetails.totalAmount || 0)
        .toString();

      finalResponse[videoId].status = videoData.status;

      if (descriptionId) {
        finalResponse[videoId].description = oThis.texts[descriptionId].text;
      }

      if (posterImageId) {
        const posterImageInfo = oThis.images[posterImageId];
        finalResponse[videoId].image_url = posterImageInfo.resolutions.original.url;
      }
    }

    return finalResponse;
  }

  /**
   * Generate video share url.
   *
   * @param {number} videoId
   *
   * @returns {string}
   * @private
   */
  _generateVideoShareUrl(videoId) {
    //todo:webhook
    return (
      coreConstants.PA_DOMAIN +
      '/' +
      gotoConstants.videoGotoKind +
      '/' +
      videoId +
      `?utm_source=share&utm_medium=video&utm_campaign=${videoId}`
    );
  }
}

module.exports = Video;
