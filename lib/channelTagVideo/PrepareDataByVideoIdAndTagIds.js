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
 *
 * @class PrepareDataByVideoIdAndTagIds
 */
class PrepareDataByVideoIdAndTagIds {
  constructor(params) {
    const oThis = this;

    oThis.videoId = params.videoId;
    oThis.tagIds = params.tagIds;

    oThis.channelIdToTagIdsMap = {};
    oThis.creatorUserId = null;
    oThis.blockedChannelIdsToDetailsMap = {};
  }

  /**
   * Perform
   *
   * @returns {Promise<void>}
   */
  async perform() {
    const oThis = this;
    let promiseArray = [];

    await oThis._fetchVideoDetailsAndSetCreatorUserId();

    promiseArray.push(oThis._fetchChannelIdsByTagIds());

    promiseArray.push(oThis._fetchUserBlockedChannels());

    await Promise.all(promiseArray);

    return oThis._prepareResponse();
  }

  /**
   * Fetch video details and check is creator channel blocked
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
    const videoDetail = videoDetailsCacheResponse.data[oThis.videoId];

    if (videoDetail.creatorUserId) {
      oThis.creatorUserId = videoDetail.creatorUserId;
    } else {
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
   * @returns {Promise<void>}
   * @private
   */
  async _fetchUserBlockedChannels() {
    const oThis = this;

    oThis.blockedChannelIdsToDetailsMap = await new ChannelUserModel().fetchByUserIdAndStatus(
      oThis.creatorUserId,
      channelUsersConstants.invertedStatuses[channelUsersConstants.blockedStatus]
    );
  }

  /**
   * Prepare response
   *
   * @private
   */
  _prepareResponse() {
    const oThis = this;

    let channelIdToVideoTagsMap = {},
      videoIdTagIdToVideoDetailsMap = {},
      allTagIdsAssociatedWithSomeChannel = [];

    for (let channelId in oThis.channelIdToTagIdsMap) {
      if (!oThis.blockedChannelIdsToDetailsMap[channelId]) {
        channelIdToVideoTagsMap[channelId] = {};
        channelIdToVideoTagsMap[channelId][oThis.videoId] = oThis.channelIdToTagIdsMap[channelId];
        allTagIdsAssociatedWithSomeChannel = allTagIdsAssociatedWithSomeChannel.concat(
          oThis.channelIdToTagIdsMap[channelId]
        );
      }
    }

    allTagIdsAssociatedWithSomeChannel = basicHelper.uniquate(allTagIdsAssociatedWithSomeChannel);
    for (let i = 0; i < allTagIdsAssociatedWithSomeChannel.length; i++) {
      let videoIdToTagIdsKey = util.getVideoIdAndTagIdMapKey(oThis.videoId, allTagIdsAssociatedWithSomeChannel[i]);
      videoIdTagIdToVideoDetailsMap[videoIdToTagIdsKey] = {
        createdAt: basicHelper.getCurrentTimestampInSeconds()
      };
    }
    let videoKey = util.getVideoIdAndTagIdMapKey(oThis.videoId, 0);
    videoIdTagIdToVideoDetailsMap[videoKey] = {
      createdAt: basicHelper.getCurrentTimestampInSeconds(),
      creatorUserId: oThis.creatorUserId
    };

    let finalResponse = {
      channelIdToVideoTagsMap: channelIdToVideoTagsMap,
      videoIdTagIdToVideoDetailsMap: videoIdTagIdToVideoDetailsMap
    };

    return responseHelper.successWithData(finalResponse);
  }
}

module.exports = PrepareDataByVideoIdAndTagIds;
