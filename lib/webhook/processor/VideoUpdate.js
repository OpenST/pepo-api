const rootPrefix = '../../..',
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  UserByIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/User'),
  VideoByIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/VideoByIds'),
  TextsByIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/TextsByIds'),
  ImageByIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/ImageByIds'),
  TokenUserByUserIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/TokenUserByUserIds'),
  VideoDetailsByVideoIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/VideoDetailsByVideoIds'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  webhookEventFormatterFactory = require(rootPrefix + '/lib/webhook/formatter/v1/factory'),
  webhookEventConstants = require(rootPrefix + '/lib/globalConstant/webhook/webhookEvent');

/**
 * Class to process webhook for video update.
 *
 * @class VideoUpdate
 */
class VideoUpdate {
  /**
   * Constructor to process webhook for video update.
   *
   * @param {object} params
   * @param {object} params.webhook_event
   * @param {object} params.webhook_endpoint
   *
   * @constructor
   */
  constructor(params) {
    const oThis = this;

    oThis.webhookEvent = params.webhook_event;
    oThis.webhookEndpoint = params.webhook_endpoint;

    oThis.videoIds = [];
    oThis.videos = {};
    oThis.videoDetails = {};

    oThis.userIds = [];
    oThis.users = {};
    oThis.tokenUserDetails = {};

    oThis.imageIds = [];
    oThis.images = {};

    oThis.descriptionIds = [];
    oThis.texts = {};
  }

  /**
   * Main performer for class.
   *
   * @sets oThis.videoIds
   *
   * @returns {Promise<*|result>}
   */
  async perform() {
    const oThis = this;

    const webhookEventExtraData = oThis.webhookEvent.extraData;

    if (!webhookEventExtraData || !webhookEventExtraData.videoId) {
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 'l_we_p_vu_1',
          api_error_identifier: 'something_went_wrong',
          debug_options: { webhookEventExtraData: webhookEventExtraData }
        })
      );
    }

    oThis.videoIds.push(webhookEventExtraData.videoId);

    await oThis.validateVideos();

    await oThis.fetchVideoDetails();

    const promisesArray = [oThis.fetchUserDetails(), oThis.fetchOstTokenUserDetails(), oThis.fetchVideoDescriptions()];
    await Promise.all(promisesArray);

    return responseHelper.successWithData(oThis.createFormattedData());
  }

  /**
   * Validate video.
   *
   * @sets oThis.videos
   *
   * @returns {Promise<void>}
   */
  async validateVideos() {
    const oThis = this;

    if (oThis.videoIds.length === 0) {
      return;
    }

    const cacheResponse = await new VideoByIdsCache({ ids: oThis.videoIds }).fetch();
    if (cacheResponse.isFailure()) {
      return Promise.reject(cacheResponse);
    }

    const cacheData = cacheResponse.data;

    for (let index = 0; index < oThis.videoIds.length; index++) {
      const videoId = oThis.videoIds[index];
      const videoData = cacheData[videoId];

      if (!CommonValidators.validateNonEmptyObject(videoData)) {
        return Promise.reject(
          responseHelper.error({
            internal_error_identifier: 'l_we_p_vu_2',
            api_error_identifier: 'something_went_wrong',
            debug_options: { videoId: videoId }
          })
        );
      }

      if (!CommonValidators.validateNonEmptyObject(videoData.resolutions.original)) {
        // TODO:OMD Change original to external.
        return Promise.reject(
          responseHelper.error({
            internal_error_identifier: 'l_we_p_vu_3',
            api_error_identifier: 'something_went_wrong',
            debug_options: { videoId: videoId, videoData: videoData }
          })
        );
      }

      oThis.videos[videoId] = videoData;
    }
  }

  /**
   * Fetch video details.
   *
   * @sets oThis.videoDetails, oThis.descriptionIds, oThis.userIds
   *
   * @returns {Promise<void>}
   */
  async fetchVideoDetails() {
    const oThis = this;

    if (oThis.videoIds.length === 0) {
      return;
    }

    const cacheResponse = await new VideoDetailsByVideoIdsCache({ videoIds: oThis.videoIds }).fetch();
    if (cacheResponse.isFailure()) {
      return Promise.reject(cacheResponse);
    }

    const cacheData = cacheResponse.data;

    for (let index = 0; index < oThis.videoIds.length; index++) {
      const videoId = oThis.videoIds[index];
      const videoDetails = cacheData[videoId];

      if (!CommonValidators.validateNonEmptyObject(videoDetails)) {
        return Promise.reject(
          responseHelper.error({
            internal_error_identifier: 'l_we_p_vu_4',
            api_error_identifier: 'something_went_wrong',
            debug_options: { videoId: videoId }
          })
        );
      }

      oThis.videoDetails[videoId] = videoDetails;
      oThis.descriptionIds.push(videoDetails.descriptionId);
      oThis.userIds.push(videoDetails.creatorUserId);
    }
  }

  /**
   * Fetch user details.
   *
   * @sets oThis.userDetails, oThis.imageIds
   *
   * @returns {Promise<void>}
   */
  async fetchUserDetails() {
    const oThis = this;

    if (oThis.userIds.length === 0) {
      return;
    }

    const cacheResponse = await new UserByIdsCache({ ids: oThis.userIds }).fetch();
    if (cacheResponse.isFailure()) {
      return Promise.reject(cacheResponse);
    }

    const cacheData = cacheResponse.data;

    for (let index = 0; index < oThis.userIds.length; index++) {
      const userId = oThis.userIds[index];
      const userData = cacheData[userId];

      if (!CommonValidators.validateNonEmptyObject(userData)) {
        return Promise.reject(
          responseHelper.error({
            internal_error_identifier: 'l_we_p_vu_5',
            api_error_identifier: 'something_went_wrong',
            debug_options: { userId: userId }
          })
        );
      }

      oThis.users[userId] = userData;
      if (userData.profileImageId) {
        oThis.imageIds.push(userData.profileImageId);
      }
    }

    if (oThis.imageIds.length > 0) {
      await oThis.fetchProfileImageDetails();
    }
  }

  /**
   * Fetch profile image details.
   *
   * @sets oThis.images
   *
   * @returns {Promise<void>}
   */
  async fetchProfileImageDetails() {
    const oThis = this;

    if (oThis.imageIds.length === 0) {
      return;
    }

    const cacheResponse = await new ImageByIdsCache({ ids: oThis.imageIds }).fetch();
    if (cacheResponse.isFailure()) {
      return Promise.reject(cacheResponse);
    }

    const cacheData = cacheResponse.data;

    for (let index = 0; index < oThis.imageIds.length; index++) {
      const imageId = oThis.imageIds[index];
      const imageData = cacheData[imageId];

      if (!CommonValidators.validateNonEmptyObject(imageData)) {
        return Promise.reject(
          responseHelper.error({
            internal_error_identifier: 'l_we_p_vu_5',
            api_error_identifier: 'something_went_wrong',
            debug_options: { imageId: imageId }
          })
        );
      }

      oThis.images[imageId] = imageData;
    }
  }

  /**
   * Fetch ost token user details.
   *
   * @sets oThis.tokenUserDetails
   *
   * @returns {Promise<void>}
   */
  async fetchOstTokenUserDetails() {
    const oThis = this;

    if (oThis.userIds.length === 0) {
      return;
    }

    const cacheResponse = await new TokenUserByUserIdsCache({ userIds: oThis.userIds }).fetch();
    if (cacheResponse.isFailure()) {
      return Promise.reject(cacheResponse);
    }

    const cacheData = cacheResponse.data;

    for (let index = 0; index < oThis.userIds.length; index++) {
      const userId = oThis.userIds[index];
      const ostTokenUserData = cacheData[userId];

      if (!CommonValidators.validateNonEmptyObject(ostTokenUserData)) {
        return Promise.reject(
          responseHelper.error({
            internal_error_identifier: 'l_we_p_vu_6',
            api_error_identifier: 'something_went_wrong',
            debug_options: { userId: userId }
          })
        );
      }

      oThis.tokenUserDetails[userId] = ostTokenUserData;
    }
  }

  /**
   * Fetch video description.
   *
   * @sets oThis.texts
   *
   * @returns {Promise<void>}
   */
  async fetchVideoDescriptions() {
    const oThis = this;

    if (oThis.descriptionIds.length === 0) {
      return;
    }

    const cacheResponse = await new TextsByIdsCache({ ids: oThis.descriptionIds }).fetch();
    if (cacheResponse.isFailure()) {
      return Promise.reject(cacheResponse);
    }

    const cacheData = cacheResponse.data;

    for (let index = 0; index < oThis.descriptionIds.length; index++) {
      const descriptionId = oThis.descriptionIds[index];
      const descriptionData = cacheData[descriptionId];

      if (!CommonValidators.validateNonEmptyObject(descriptionData)) {
        return Promise.reject(
          responseHelper.error({
            internal_error_identifier: 'l_we_p_vu_7',
            api_error_identifier: 'something_went_wrong',
            debug_options: { descriptionId: descriptionId }
          })
        );
      }

      oThis.texts[descriptionId] = descriptionData;
    }
  }

  /**
   * Create formatted data.
   *
   * @returns {Promise<{}>}
   */
  async createFormattedData() {
    const oThis = this;

    const formatterParams = {
      webhookEventKind: webhookEventConstants.videoUpdateTopicKind,
      webhookEndpoint: oThis.webhookEndpoint,
      videoIds: oThis.videoIds,
      videos: oThis.videos,
      videoDetails: oThis.videoDetails,
      texts: oThis.texts,
      userIds: oThis.userIds,
      users: oThis.users,
      tokenUsers: oThis.tokenUserDetails,
      images: oThis.images
    };

    return webhookEventFormatterFactory.perform(formatterParams);
  }
}

module.exports = VideoUpdate;
