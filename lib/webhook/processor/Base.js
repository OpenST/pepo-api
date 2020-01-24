const rootPrefix = '../../..',
  UserModel = require(rootPrefix + '/app/models/mysql/User'),
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  TagByIdCache = require(rootPrefix + '/lib/cacheManagement/multi/Tag'),
  UserByIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/User'),
  VideoByIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/VideoByIds'),
  TextsByIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/TextsByIds'),
  ImageByIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/ImageByIds'),
  TwitterUserByIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/TwitterUserByIds'),
  TokenUserByUserIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/TokenUserByUserIds'),
  TextIncludesByIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/TextIncludesByTextIds'),
  TwitterUserByUserIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/TwitterUserByUserIds'),
  GithubUsersByUserIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/GithubUsersByUserIds'),
  VideoDetailsByVideoIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/VideoDetailsByVideoIds'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  textIncludeConstants = require(rootPrefix + '/lib/globalConstant/cassandra/textInclude'),
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
   * @param {object} params.webhookEvent
   * @param {object} params.webhookEndpoint
   *
   * @constructor
   */
  constructor(params) {
    const oThis = this;

    oThis.webhookEvent = params.webhookEvent;
    oThis.webhookEndpoint = params.webhookEndpoint;

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

    oThis.tagIds = [];
    oThis.tags = {};
    oThis.descriptionIdToTagIdsMap = {};
    oThis.twitterUsersByUserIdMap = {};
    oThis.githubUsersByUserIdMap = {};
  }

  /**
   * Main performer for class.
   *
   * @returns {Promise<*|result>}
   */
  async perform() {
    const oThis = this;

    const validationResponse = await oThis.validateAndSanitize();
    if (validationResponse.isFailure()) {
      return validationResponse;
    }

    const videosValidationResponse = await oThis.validateVideos();
    if (videosValidationResponse.isFailure()) {
      return videosValidationResponse;
    }

    const videoDetailsResponse = await oThis.fetchVideoDetails();
    if (videoDetailsResponse.isFailure()) {
      return videoDetailsResponse;
    }

    const classSpecificActionsResponse = await oThis.performClassSpecificActions();
    if (classSpecificActionsResponse.isFailure()) {
      return classSpecificActionsResponse;
    }

    const promisesArray = [
      oThis.fetchUserDetails(),
      oThis.fetchOstTokenUserDetails(),
      oThis.fetchVideoDescriptions(),
      oThis.fetchTagIdsFromDescriptions()
    ];
    const promisesResponse = await Promise.all(promisesArray);

    for (let index = 0; index < promisesResponse.length; index++) {
      if (promisesResponse[index].isFailure()) {
        return promisesResponse[index];
      }
    }

    const tagsResponse = await oThis.fetchTags();
    if (tagsResponse.isFailure()) {
      return tagsResponse;
    }

    const imageDetailsResponse = await oThis.fetchProfileImageDetails();
    if (imageDetailsResponse.isFailure()) {
      return imageDetailsResponse;
    }

    return responseHelper.successWithData(await oThis.createFormattedData());
  }

  /**
   * Validate and sanitize.
   *
   * @sets oThis.webhookEventExtraData
   *
   * @returns {Promise<result>}
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

    return responseHelper.successWithData({});
  }

  /**
   * Validate video.
   *
   * @sets oThis.videos, oThis.imageIds
   *
   * @returns {Promise<result>}
   */
  async validateVideos() {
    const oThis = this;

    if (oThis.videoIds.length === 0) {
      return responseHelper.successWithData({});
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

      if (!CommonValidators.validateNonEmptyObject(videoData.resolutions.external)) {
        return responseHelper.error({
          internal_error_identifier: 'l_we_p_b_3',
          api_error_identifier: 'something_went_wrong',
          debug_options: { videoId: videoId, videoData: videoData }
        });
      }

      oThis.videos[videoId] = videoData;
      if (videoData.posterImageId) {
        oThis.imageIds.push(videoData.posterImageId);
      }
    }

    return responseHelper.successWithData({});
  }

  /**
   * Fetch video details.
   *
   * @sets oThis.videoDetails, oThis.descriptionIds, oThis.userIds
   *
   * @returns {Promise<result>}
   */
  async fetchVideoDetails() {
    const oThis = this;

    if (oThis.videoIds.length === 0) {
      return responseHelper.successWithData({});
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
      if (videoDetails.descriptionId) {
        oThis.descriptionIds.push(videoDetails.descriptionId);
      }
      oThis.userIds.push(videoDetails.creatorUserId);
    }

    return responseHelper.successWithData({});
  }

  /**
   * Fetch user details.
   *
   * @sets oThis.userDetails, oThis.imageIds
   *
   * @returns {Promise<result>}
   */
  async fetchUserDetails() {
    const oThis = this;

    if (oThis.userIds.length === 0) {
      return responseHelper.successWithData({});
    }

    const cacheResponse = await new UserByIdsCache({ ids: oThis.userIds }).fetch();
    if (cacheResponse.isFailure()) {
      return Promise.reject(cacheResponse);
    }

    const cacheData = cacheResponse.data,
      githubUserIds = [],
      twitterUserIdsToGetTwitterHandle = [];

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

      if (UserModel.isUserTwitterLogin(userData.properties)) {
        twitterUserIdsToGetTwitterHandle.push(userId);
      }

      if (UserModel.isUserGithubLogin(userData.properties)) {
        githubUserIds.push(userId);
      }

      oThis.githubUsersByUserIdMap[userId] = {};
      oThis.twitterUsersByUserIdMap[userId] = {};
    }

    const promises = [
      oThis._fetchTwitterHandlesForUserIds(twitterUserIdsToGetTwitterHandle),
      oThis._fetchGithubDetailsForUserIds(githubUserIds)
    ];

    await Promise.all(promises);

    return responseHelper.successWithData({});
  }

  /**
   * Fetch Github Details for user ids.
   *
   * @sets oThis.githubUsersByUserIdMap
   *
   * @returns {Promise<*>}
   * @private
   */
  async _fetchGithubDetailsForUserIds(userIds) {
    const oThis = this;

    if (userIds.length === 0) {
      return;
    }

    const githubUsersByUserIdsCacheResponse = await new GithubUsersByUserIdsCache({
      userIds: userIds
    }).fetch();

    if (githubUsersByUserIdsCacheResponse.isFailure()) {
      return Promise.reject(githubUsersByUserIdsCacheResponse);
    }

    Object.assign(oThis.githubUsersByUserIdMap, githubUsersByUserIdsCacheResponse.data);
  }

  /**
   * Fetch twitter handles for user ids.
   *
   * @sets oThis.twitterUsersByUserIdMap
   *
   * @returns {Promise<*>}
   * @private
   */
  async _fetchTwitterHandlesForUserIds(userIds) {
    const oThis = this;

    if (userIds.length === 0) {
      return;
    }

    const twitterUserByUserIdsCacheResponse = await new TwitterUserByUserIdsCache({
      userIds: userIds
    }).fetch();

    if (twitterUserByUserIdsCacheResponse.isFailure()) {
      return Promise.reject(twitterUserByUserIdsCacheResponse);
    }

    const twitterUserByUserIdsCacheData = twitterUserByUserIdsCacheResponse.data;

    const twitterUserIds = [];
    for (let userId in twitterUserByUserIdsCacheData) {
      twitterUserIds.push(twitterUserByUserIdsCacheData[userId].id);
    }

    const twitterUserByTwitterUserIdsCacheResponse = await new TwitterUserByIdsCache({ ids: twitterUserIds }).fetch();

    if (twitterUserByTwitterUserIdsCacheResponse.isFailure()) {
      return Promise.reject(twitterUserByTwitterUserIdsCacheResponse);
    }

    const twitterUserByTwitterUserIdsData = twitterUserByTwitterUserIdsCacheResponse.data;

    for (let userId in twitterUserByUserIdsCacheData) {
      let twitterUserId = twitterUserByUserIdsCacheData[userId].id;
      oThis.twitterUsersByUserIdMap[userId] = twitterUserByTwitterUserIdsData[twitterUserId];
    }

    return responseHelper.successWithData({});
  }

  /**
   * Fetch tag ids from descriptions.
   *
   * @sets oThis.tagIds, oThis.descriptionIdToTagIdsMap
   *
   * @returns {Promise<*|result>}
   */
  async fetchTagIdsFromDescriptions() {
    const oThis = this;

    if (oThis.descriptionIds.length === 0) {
      return responseHelper.successWithData({});
    }

    const cacheResponse = await new TextIncludesByIdsCache({ ids: oThis.descriptionIds }).fetch();
    if (cacheResponse.isFailure()) {
      return Promise.reject(cacheResponse);
    }

    const includesData = cacheResponse.data;

    for (const descriptionId in includesData) {
      const textIncludes = includesData[descriptionId];

      for (let index = 0; index < textIncludes.length; index++) {
        const include = textIncludes[index],
          entity = include.entityIdentifier.split('_');

        if (entity[0] === textIncludeConstants.tagEntityKindShort) {
          oThis.tagIds.push(+entity[1]);
          oThis.descriptionIdToTagIdsMap[descriptionId] = oThis.descriptionIdToTagIdsMap[descriptionId] || [];
          oThis.descriptionIdToTagIdsMap[descriptionId].push(+entity[1]);
        }
      }
    }

    return responseHelper.successWithData({});
  }

  /**
   * Fetch tags.
   *
   * @sets oThis.tags
   *
   * @returns {Promise<*|result>}
   */
  async fetchTags() {
    const oThis = this;

    if (oThis.tagIds.length === 0) {
      return responseHelper.successWithData({});
    }

    const cacheResponse = await new TagByIdCache({ ids: oThis.tagIds }).fetch();
    if (cacheResponse.isFailure()) {
      return Promise.reject(cacheResponse);
    }

    const cacheData = cacheResponse.data;

    for (let index = 0; index < oThis.tagIds.length; index++) {
      const tagId = oThis.tagIds[index];
      const tagData = cacheData[tagId];

      if (!CommonValidators.validateNonEmptyObject(tagData)) {
        return responseHelper.error({
          internal_error_identifier: 'l_we_p_b_6',
          api_error_identifier: 'something_went_wrong',
          debug_options: { tagId: tagId }
        });
      }

      oThis.tags[tagId] = tagData;
    }

    return responseHelper.successWithData({});
  }

  /**
   * Fetch profile image details.
   *
   * @sets oThis.images
   *
   * @returns {Promise<result>}
   */
  async fetchProfileImageDetails() {
    const oThis = this;

    if (oThis.imageIds.length === 0) {
      return responseHelper.successWithData({});
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
          internal_error_identifier: 'l_we_p_b_7',
          api_error_identifier: 'something_went_wrong',
          debug_options: { imageId: imageId }
        });
      }

      oThis.images[imageId] = imageData;
    }

    return responseHelper.successWithData({});
  }

  /**
   * Fetch ost token user details.
   *
   * @sets oThis.tokenUserDetails
   *
   * @returns {Promise<result>}
   */
  async fetchOstTokenUserDetails() {
    const oThis = this;

    if (oThis.userIds.length === 0) {
      return responseHelper.successWithData({});
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
          internal_error_identifier: 'l_we_p_b_8',
          api_error_identifier: 'something_went_wrong',
          debug_options: { userId: userId }
        });
      }

      oThis.tokenUserDetails[userId] = ostTokenUserData;
    }

    return responseHelper.successWithData({});
  }

  /**
   * Fetch video description.
   *
   * @sets oThis.texts
   *
   * @returns {Promise<result>}
   */
  async fetchVideoDescriptions() {
    const oThis = this;

    if (oThis.descriptionIds.length === 0) {
      return responseHelper.successWithData({});
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

    return responseHelper.successWithData({});
  }

  /**
   * Perform class specific actions. Should be overridden by sub-class if needed.
   *
   * @returns {Promise<result>}
   */
  async performClassSpecificActions() {
    return responseHelper.successWithData({});
  }

  /**
   * Create formatted data.
   *
   * @returns {Promise<result>}
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
