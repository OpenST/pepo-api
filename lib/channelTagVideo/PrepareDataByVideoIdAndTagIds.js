const rootPrefix = '../..',
  ChannelTagModel = require(rootPrefix + '/app/models/mysql/channel/ChannelTag'),
  ChannelUserModel = require(rootPrefix + '/app/models/mysql/channel/ChannelUser'),
  VideoDetailsByVideoIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/VideoDetailsByVideoIds'),
  util = require(rootPrefix + '/lib/util'),
  basicHelper = require(rootPrefix + '/helpers/basic'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  channelUsersConstants = require(rootPrefix + '/lib/globalConstant/channel/channelUsers');

/**
 * Class to prepare data by videoId and tagIds.
 *
 * @class PrepareDataByVideoIdAndTagIds
 */
class PrepareDataByVideoIdAndTagIds {
  /**
   * Constructor to prepare data by videoId and tagIds.
   *
   * @param {object} params
   * @param {number} params.videoId
   * @param {array<number>} params.tagIds
   *
   * @constructor
   */
  constructor(params) {
    const oThis = this;

    oThis.videoId = params.videoId;
    oThis.tagIds = params.tagIds;

    oThis.channelIdToTagIdsMap = {};
    oThis.blockedChannelIdsToDetailsMap = {};
    oThis.videoDetail = {};
  }

  /**
   * Main performer for class.
   *
   * @returns {Promise<result>}
   */
  async perform() {
    const oThis = this;

    await oThis._fetchVideoDetailsAndSetCreatorUserId();

    await Promise.all([oThis._fetchChannelIdsByTagIds(), oThis._fetchUserBlockedChannels()]);

    return oThis._prepareResponse();
  }

  /**
   * Fetch video details and check if video creator is channel blocked.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _fetchVideoDetailsAndSetCreatorUserId() {
    const oThis = this;

    const videoDetailsCacheResponse = await new VideoDetailsByVideoIdsCache({ videoIds: [oThis.videoId] }).fetch();
    if (videoDetailsCacheResponse.isFailure()) {
      return Promise.reject(videoDetailsCacheResponse);
    }
    oThis.videoDetail = videoDetailsCacheResponse.data[oThis.videoId];

    if (!oThis.videoDetail.creatorUserId) {
      logger.error('Creator of given video id not found. Inconsistent data. Manual intervention required !!');

      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 'l_ctv_pdbvt_1',
          api_error_identifier: 'something_went_wrong',
          debug_options: {
            videoId: oThis.videoId
          }
        })
      );
    }
  }

  /**
   * Fetch channel ids by tag ids.
   *
   * @sets oThis.channelIdToTagIdsMap
   *
   * @returns {Promise<void>}
   * @private
   */
  async _fetchChannelIdsByTagIds() {
    const oThis = this;

    oThis.channelIdToTagIdsMap = await new ChannelTagModel().fetchActiveChannelsByTagIds(oThis.tagIds);
  }

  /**
   * Fetch user blocked channels.
   *
   * @sets oThis.blockedChannelIdsToDetailsMap
   *
   * @returns {Promise<void>}
   * @private
   */
  async _fetchUserBlockedChannels() {
    const oThis = this;

    oThis.blockedChannelIdsToDetailsMap = await new ChannelUserModel().fetchByUserIdAndStatus(
      oThis.videoDetail.creatorUserId,
      channelUsersConstants.invertedStatuses[channelUsersConstants.blockedStatus]
    );
  }

  /**
   * Prepare response.
   *
   * @returns {*|result}
   * @private
   */
  _prepareResponse() {
    const oThis = this;

    const channelIdToVideoTagsMap = {},
      videoIdTagIdToVideoDetailsMap = {};

    let allTagIdsAssociatedWithSomeChannel = [];

    for (const channelId in oThis.channelIdToTagIdsMap) {
      if (!oThis.blockedChannelIdsToDetailsMap[channelId]) {
        channelIdToVideoTagsMap[channelId] = {};
        channelIdToVideoTagsMap[channelId][oThis.videoId] = oThis.channelIdToTagIdsMap[channelId];
        allTagIdsAssociatedWithSomeChannel = allTagIdsAssociatedWithSomeChannel.concat(
          oThis.channelIdToTagIdsMap[channelId]
        );
      }
    }

    allTagIdsAssociatedWithSomeChannel = basicHelper.uniquate(allTagIdsAssociatedWithSomeChannel);
    for (let index = 0; index < allTagIdsAssociatedWithSomeChannel.length; index++) {
      const videoIdToTagIdsKey = util.getVideoIdAndTagIdMapKey(
        oThis.videoId,
        allTagIdsAssociatedWithSomeChannel[index]
      );
      videoIdTagIdToVideoDetailsMap[videoIdToTagIdsKey] = {
        createdAt: oThis.videoDetail.createdAt
      };
    }
    const videoKey = util.getVideoIdAndTagIdMapKey(oThis.videoId, 0);
    videoIdTagIdToVideoDetailsMap[videoKey] = {
      createdAt: oThis.videoDetail.createdAt,
      creatorUserId: oThis.videoDetail.creatorUserId
    };

    const finalResponse = {
      channelIdToVideoTagsMap: channelIdToVideoTagsMap,
      videoIdTagIdToVideoDetailsMap: videoIdTagIdToVideoDetailsMap
    };

    return responseHelper.successWithData(finalResponse);
  }
}

module.exports = PrepareDataByVideoIdAndTagIds;
