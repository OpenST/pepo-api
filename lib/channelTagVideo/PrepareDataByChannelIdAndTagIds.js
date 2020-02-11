const rootPrefix = '../..',
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  VideoTagModel = require(rootPrefix + '/app/models/mysql/VideoTag'),
  VideoDetailsByVideoIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/VideoDetailsByVideoIds'),
  ChannelBlockedUsersByChannelIds = require(rootPrefix +
    '/lib/cacheManagement/multi/channel/ChannelBlockedUserByChannelIds'),
  util = require(rootPrefix + '/lib/util'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  videoTagConstants = require(rootPrefix + '/lib/globalConstant/videoTag');

/**
 * Class to prepare data by channel id and tag ids.
 *
 * @class PrepareDataByChannelIdAndTagIds
 */
class PrepareDataByChannelIdAndTagIds {
  /**
   * Constructor to prepare data by channel id and tag ids.
   *
   * @param {object} params
   * @param {number} params.channelId
   * @param {array<number>} params.tagIds
   *
   * @constructor
   */
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
   * Main performer for class.
   *
   * @returns {Promise<result>}
   */
  async perform() {
    const oThis = this;

    await Promise.all([oThis._fetchChannelBlockedUsers(), oThis._fetchVideoIdsByTagIds()]);

    await oThis._fetchVideoDetailsAndSetCreatorUserId();

    oThis._filterBlockedVideos();

    return oThis._prepareResponse();
  }

  /**
   * Fetch creator users blocked channels.
   *
   * @sets oThis.blockedUserIdToChannelIdMap
   *
   * @returns {Promise<void>}
   * @private
   */
  async _fetchChannelBlockedUsers() {
    const oThis = this;

    const cacheResponse = await new ChannelBlockedUsersByChannelIds({ channelIds: [oThis.channelId] }).fetch();

    if (cacheResponse.isFailure()) {
      return Promise.reject(cacheResponse);
    }

    const blockedUserIdsArray = cacheResponse.data[oThis.channelId];

    for (let index = 0; index < blockedUserIdsArray.length; index++) {
      const userId = blockedUserIdsArray[index];
      oThis.blockedUserIdToChannelIdMap[userId] = oThis.channelId;
    }
  }

  /**
   * Fetch video ids by tag ids.
   *
   * @sets oThis.videoIdTagIdToVideoDetailsMap
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

      const videoIdTagIdKey = util.getVideoIdAndTagIdMapKey(dbRow.video_id, dbRow.tag_id),
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
   * @sets if (oThis.blockedUserIdToChannelIdMap
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
          const videoIdKey = util.getVideoIdAndTagIdMapKey(videoId, 0);
          oThis.videoIdTagIdToVideoDetailsMap[videoIdKey].creatorUserId = videoDetail.creatorUserId;
        }
      }
    }
  }

  /**
   * Filter blocked users.
   *
   * @sets oThis.videoIdToTagIdsMap
   *
   * @private
   */
  _filterBlockedVideos() {
    const oThis = this;

    for (let index = 0; index < oThis.videoIdsToRemove.length; index++) {
      const blockedVideoId = oThis.videoIdsToRemove[index];
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

    const channelIdToVideoTagsMap = {};
    channelIdToVideoTagsMap[oThis.channelId] = oThis.videoIdToTagIdsMap;

    const finalResponse = {
      channelIdToVideoTagsMap: channelIdToVideoTagsMap,
      videoIdTagIdToVideoDetailsMap: oThis.videoIdTagIdToVideoDetailsMap
    };

    return responseHelper.successWithData(finalResponse);
  }
}

module.exports = PrepareDataByChannelIdAndTagIds;
