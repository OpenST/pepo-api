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
   * @param {object} params.webhookEndpoint
   * @param {array<number>} params.videoIds
   * @param {object} params.videos
   * @param {object} params.videoDetails
   * @param {object} params.texts
   * @param {object} params.images
   * @param {object} params.descriptionIdToTagIdsMap
   * @param {object} params.tags
   *
   * @constructor
   */
  constructor(params) {
    const oThis = this;

    oThis.webhookEndpoint = params.webhookEndpoint;
    oThis.videoIds = params.videoIds;
    oThis.videos = params.videos;
    oThis.videoDetails = params.videoDetails;
    oThis.texts = params.texts;
    oThis.images = params.images;
    oThis.descriptionIdToTagIdsMap = params.descriptionIdToTagIdsMap;
    oThis.tags = params.tags;
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
        id: Number(videoId),
        creator_id: '',
        url: '',
        video_url: '',
        total_contributors: 0,
        total_contribution_amount: 0,
        tags: [],
        description: '',
        poster_image: '',
        status: ''
      };

      const videoData = oThis.videos[videoId];
      finalResponse[videoId].url = oThis._generateVideoShareUrl(videoId); // PEPO App URL.
      finalResponse[videoId].video_url = videoData.resolutions.external.url; // CloudFront URL of the video.

      const videoDetails = oThis.videoDetails[videoId];
      const descriptionId = videoDetails.descriptionId;
      const posterImageId = videoData.posterImageId;

      finalResponse[videoId].creator_id = Number(videoDetails.creatorUserId);
      finalResponse[videoId].total_contributors = Number(videoDetails.totalContributedBy || 0);
      finalResponse[videoId].total_contribution_amount = basicHelper.toPrecision(videoDetails.totalAmount || 0, 2);

      finalResponse[videoId].status = videoData.status;

      if (descriptionId) {
        // Assign video description.
        finalResponse[videoId].description = oThis.texts[descriptionId].text;
        // Assign tag names if tags are associated with a description.
        const tagsIds = oThis.descriptionIdToTagIdsMap[descriptionId];
        if (tagsIds && tagsIds.length > 0) {
          const tagNames = [];
          for (let ind = 0; ind < tagsIds.length; ind++) {
            const tagId = tagsIds[ind];

            tagNames.push(oThis.tags[tagId].name);
          }
          finalResponse[videoId].tags = tagNames;
        }
      }

      if (posterImageId) {
        const posterImageInfo = oThis.images[posterImageId];
        finalResponse[videoId].poster_image = posterImageInfo.resolutions.original.url;
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
    const oThis = this;

    return (
      coreConstants.PA_DOMAIN +
      '/' +
      gotoConstants.videoGotoKind +
      '/' +
      videoId +
      `?utm_source=${oThis.webhookEndpoint.clientId}&utm_medium=webhook&utm_campaign=${videoId}`
    );
  }
}

module.exports = Video;
