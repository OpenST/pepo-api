const rootPrefix = '../..',
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  VideoTagModel = require(rootPrefix + '/app/models/mysql/VideoTag'),
  VideoDetailsByVideoIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/VideoDetailsByVideoIds'),
  ChannelBlockedUsersByChannelIds = require(rootPrefix +
    '/lib/cacheManagement/multi/channel/ChannelBlockedUserByChannelIds'),
  util = require(rootPrefix + '/lib/util'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  videoTagConstants = require(rootPrefix + '/lib/globalConstant/videoTag'),
  channelUsersConstants = require(rootPrefix + '/lib/globalConstant/channel/channelUsers');

/**
 * Class to prepare data by channel id and tag ids.
 *
 *
 * @class PrepareDataByChannelIdAndTagIds
 */
class PrepareDataByChannelIdAndTagIds {
  constructor(params) {
    const oThis = this;

    oThis.channelId = params.channelId;
    oThis.tagIds = params.tagIds;

    oThis.videoIdToTagIdsMap = {};
    oThis.videoIdTagIdToVideoDetailsMap = {};
    oThis.videoIds = [];
    oThis.videoIdsToRemove = [];
    oThis.blockedUserIdToChannelIdMap = {};
  }

  /**
   * Perform
   *
   * @returns {Promise<void>}
   */
  async perform() {
    const oThis = this;

    let promiseArray = [oThis._fetchChannelBlockedUsers(), oThis._fetchVideoIdsByTagIds()];

    await Promise.all(promiseArray);

    await oThis._fetchVideoDetailsAndSetCreatorUserId();

    oThis._filterBlockedVideos();

    return oThis._prepareResponse();
  }

  /**
   * Fetch creator users blocked channels.
   *
   * @returns {Promise<void>}
   * @private
   */
  // TODO - channel - we should have cache for this.
  async _fetchChannelBlockedUsers() {
    const oThis = this;

    let cacheResponse = await new ChannelBlockedUsersByChannelIds({ channelIds: [oThis.channelId] }).fetch();

    if (cacheResponse.isFailure()) {
      return Promise.reject(cacheResponse);
    }

    let blockedUserIdsArray = cacheResponse.data[oThis.channelId];

    for (let i = 0; i < blockedUserIdsArray.length; i++) {
      let userId = blockedUserIdsArray[i];
      oThis.blockedUserIdToChannelIdMap[userId] = oThis.channelId;
    }
  }

  /**
   * Fetch video ids by tag ids.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _fetchVideoIdsByTagIds() {
    const oThis = this;

    const dbRows = await new VideoTagModel()
      .select('*')
      .where({ tag_id: oThis.tagIds, video_kind: videoTagConstants.invertedKinds[videoTagConstants.postKind] })
      .order_by('created_at DESC')
      .fire();

    for (let index = 0; index < dbRows.length; index++) {
      const dbRow = dbRows[index];
      oThis.videoIdToTagIdsMap[dbRow.video_id] = oThis.videoIdToTagIdsMap[dbRow.video_id] || [];
      oThis.videoIdToTagIdsMap[dbRow.video_id].push(dbRow.tag_id);
      oThis.videoIds.push(dbRow.video_id);

      let videoIdTagIdKey = util.getVideoIdAndTagIdMapKey(dbRow.video_id, dbRow.tag_id),
        videoIdKey = util.getVideoIdAndTagIdMapKey(dbRow.video_id, 0);
      oThis.videoIdTagIdToVideoDetailsMap[videoIdTagIdKey] = {
        createdAt: dbRow.created_at
      };
      oThis.videoIdTagIdToVideoDetailsMap[videoIdKey] = {
        createdAt: dbRow.created_at
      };
    }
  }

  /**
   * Fetch video details and set creator user id.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _fetchVideoDetailsAndSetCreatorUserId() {
    const oThis = this;

    const videoDetailsCacheResponse = await new VideoDetailsByVideoIdsCache({ videoIds: oThis.videoIds }).fetch();
    if (videoDetailsCacheResponse.isFailure()) {
      return Promise.reject(videoDetailsCacheResponse);
    }

    const videoDetailsCacheData = videoDetailsCacheResponse.data;

    for (const videoId in videoDetailsCacheData) {
      const videoDetail = videoDetailsCacheData[videoId];

      if (CommonValidators.validateNonEmptyObject(videoDetail)) {
        if (oThis.blockedUserIdToChannelIdMap[videoDetail.creatorUserId]) {
          oThis.videoIdsToRemove.push(videoId);
        } else {
          let videoIdKey = util.getVideoIdAndTagIdMapKey(videoId, 0);
          oThis.videoIdTagIdToVideoDetailsMap[videoIdKey].creatorUserId = videoDetail.creatorUserId;
        }
      }
    }
  }

  /**
   * Filter blocked users.
   *
   * @private
   */
  _filterBlockedVideos() {
    const oThis = this;

    for (let i = 0; i < oThis.videoIdsToRemove.length; i++) {
      let blockedVideoId = oThis.videoIdsToRemove[i];
      if (oThis.videoIdToTagIdsMap[blockedVideoId]) {
        delete oThis.videoIdToTagIdsMap[blockedVideoId];
      }
    }
  }

  /**
   * Prepare response
   *
   * @private
   */
  _prepareResponse() {
    const oThis = this;

    let channelIdToVideoTagsMap = {};
    channelIdToVideoTagsMap[oThis.channelId] = oThis.videoIdToTagIdsMap;

    let finalResponse = {
      channelIdToVideoTagsMap: channelIdToVideoTagsMap,
      videoIdTagIdToVideoDetailsMap: oThis.videoIdTagIdToVideoDetailsMap
    };
    return responseHelper.successWithData(finalResponse);
  }
}

module.exports = PrepareDataByChannelIdAndTagIds;
