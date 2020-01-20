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
   *
   * @constructor
   */
  constructor(params) {
    const oThis = this;

    oThis.videoIds = params.videoIds;
    oThis.videos = params.videos;
    oThis.videoDetails = params.videoDetails;
    oThis.texts = params.texts;
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
        description: ''
      };

      const videoData = oThis.videos[videoId];
      finalResponse[videoId].video_url = videoData.resolutions.external.url;

      const videoDetails = oThis.videoDetails[videoId];
      const descriptionId = videoDetails.descriptionId;

      finalResponse[videoId].creator_id = videoDetails.creatorUserId;
      finalResponse[videoId].total_contributors = videoDetails.totalContributedBy;
      finalResponse[videoId].total_contribution_amount = videoDetails.totalAmount;

      if (descriptionId) {
        finalResponse[videoId].description = oThis.texts[descriptionId].text;
      }
    }

    return finalResponse;
  }
}

module.exports = Video;
