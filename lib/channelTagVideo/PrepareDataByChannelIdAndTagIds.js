const rootPrefix = '../..',
  VideoTagModel = require(rootPrefix + '/app/models/mysql/VideoTag'),
  util = require(rootPrefix + '/lib/util'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

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
  }

  /**
   * Perform
   *
   * @returns {Promise<void>}
   */
  async perform() {
    const oThis = this;

    await oThis._fetchVideoIdsByTagIds();

    return oThis._prepareResponse();
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
      .where({ tag_id: oThis.tagIds })
      .order_by('created_at DESC')
      .fire();

    for (let index = 0; index < dbRows.length; index++) {
      const dbRow = dbRows[index];
      oThis.videoIdToTagIdsMap[dbRow.video_id] = oThis.videoIdToTagIdsMap[dbRow.video_id] || [];
      oThis.videoIdToTagIdsMap[dbRow.video_id].push(dbRow.tag_id);

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
