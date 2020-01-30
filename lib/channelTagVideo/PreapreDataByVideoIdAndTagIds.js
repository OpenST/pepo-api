const rootPrefix = '../..',
  ChannelTagModel = require(rootPrefix + '/app/models/mysql/channel/ChannelTag'),
  util = require(rootPrefix + '/lib/util'),
  basicHelper = require(rootPrefix + '/helpers/basic'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

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
  }

  /**
   * Perform
   *
   * @returns {Promise<void>}
   */
  async perform() {
    const oThis = this;

    await oThis._fetchChannelIdsByTagIds();

    return oThis._prepareResponse();
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
   * Prepare response
   *
   * @private
   */
  _prepareResponse() {
    const oThis = this;

    let channelIdToVideoTagsMap = {},
      videoIdTagIdToVideoDetailsMap = {};

    for (let channelId in oThis.channelIdToTagIdsMap) {
      channelIdToVideoTagsMap[channelId] = {};
      channelIdToVideoTagsMap[channelId][oThis.videoId] = oThis.channelIdToTagIdsMap[channelId];
    }

    for (let i = 0; i < oThis.tagIds.length; i++) {
      let videoIdToTagIdsKey = util.getVideoIdAndTagIdMapKey(oThis.videoId, oThis.tagIds[i]);
      videoIdTagIdToVideoDetailsMap[videoIdToTagIdsKey] = {
        createdAt: basicHelper.getCurrentTimestampInSeconds()
      };
    }
    let videoKey = util.getVideoIdAndTagIdMapKey(oThis.videoId, 0);
    videoIdTagIdToVideoDetailsMap[videoKey] = {
      createdAt: basicHelper.getCurrentTimestampInSeconds()
    };

    let finalResponse = {
      channelIdToVideoTagsMap: channelIdToVideoTagsMap,
      videoIdTagIdToVideoDetailsMap: videoIdTagIdToVideoDetailsMap
    };

    return responseHelper.successWithData(finalResponse);
  }
}

module.exports = PrepareDataByVideoIdAndTagIds;
