const rootPrefix = '../../..',
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  UserByIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/User'),
  VideoByIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/VideoByIds'),
  TextsByIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/TextsByIds'),
  ImageByIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/ImageByIds'),
  TokenUserByUserIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/TokenUserByUserIds'),
  VideoDetailsByVideoIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/VideoDetailsByVideoIds'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  webhookEndpointConstants = require(rootPrefix + '/lib/globalConstant/webhook/webhookEndpoint');

/**
 * Base class to process webhook.
 *
 * @class Base
 */
class Base {
  /**
   * Constructor of base class to process webhook.
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

    oThis.webhookEventExtraData = null;

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
   * @returns {Promise<*|result>}
   */
  async perform() {
    const oThis = this;

    await oThis.validateAndSanitize();

    await oThis.validateVideos();

    await oThis.fetchVideoDetails();

    await oThis.performClassSpecificActions();

    const promisesArray = [oThis.fetchUserDetails(), oThis.fetchOstTokenUserDetails(), oThis.fetchVideoDescriptions()];
    await Promise.all(promisesArray);

    return responseHelper.successWithData(await oThis.createFormattedData());
  }

  /**
   * Validate and sanitize.
   *
   * @sets oThis.webhookEventExtraData
   *
   * @returns {Promise<void>}
   */
  async validateAndSanitize() {
    const oThis = this;

    oThis.webhookEventExtraData = oThis.webhookEvent.extraData;

    if (!oThis.webhookEventExtraData) {
      return responseHelper.error({
        internal_error_identifier: 'l_we_p_b_1',
        api_error_identifier: 'something_went_wrong',
        debug_options: { webhookEventExtraData: oThis.webhookEventExtraData }
      });
    }
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
        return responseHelper.error({
          internal_error_identifier: 'l_we_p_b_2',
          api_error_identifier: 'something_went_wrong',
          debug_options: { videoId: videoId }
        });
      }

      if (!CommonValidators.validateNonEmptyObject(videoData.resolutions.original)) {
        // TODO:OMD Change original to external.
        return responseHelper.error({
          internal_error_identifier: 'l_we_p_b_3',
          api_error_identifier: 'something_went_wrong',
          debug_options: { videoId: videoId, videoData: videoData }
        });
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
        return responseHelper.error({
          internal_error_identifier: 'l_we_p_b_4',
          api_error_identifier: 'something_went_wrong',
          debug_options: { videoId: videoId }
        });
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
        return responseHelper.error({
          internal_error_identifier: 'l_we_p_b_5',
          api_error_identifier: 'something_went_wrong',
          debug_options: { userId: userId }
        });
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
        return responseHelper.error({
          internal_error_identifier: 'l_we_p_b_5',
          api_error_identifier: 'something_went_wrong',
          debug_options: { imageId: imageId }
        });
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
        return responseHelper.error({
          internal_error_identifier: 'l_we_p_b_6',
          api_error_identifier: 'something_went_wrong',
          debug_options: { userId: userId }
        });
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
        return responseHelper.error({
          internal_error_identifier: 'l_we_p_vu_7',
          api_error_identifier: 'something_went_wrong',
          debug_options: { descriptionId: descriptionId }
        });
      }

      oThis.texts[descriptionId] = descriptionData;
    }
  }

  /**
   * Perform class specific actions. Should be overridden by sub-class if needed.
   *
   * @returns {Promise<void>}
   */
  async performClassSpecificActions() {
    // Do nothing.
  }

  /**
   * Create formatted data.
   *
   * @returns {Promise<void>}
   */
  async createFormattedData() {
    const oThis = this;

    switch (oThis.webhookEndpoint.apiVersion) {
      case webhookEndpointConstants.versionOne: {
        const webhookEventFormatterFactory = require(rootPrefix + '/lib/webhook/formatter/v1/factory');

        return webhookEventFormatterFactory.perform(oThis.formatterParams);
      }
      default: {
        return responseHelper.error({
          internal_error_identifier: 'l_we_p_vu_8',
          api_error_identifier: 'something_went_wrong',
          debug_options: { webhookEndpointApiVersion: oThis.webhookEndpoint.apiVersion }
        });
      }
    }
  }

  /**
   * Get formatter params.
   */
  get formatterParams() {
    throw new Error('Sub-class to implement.');
  }
}

module.exports = Base;
