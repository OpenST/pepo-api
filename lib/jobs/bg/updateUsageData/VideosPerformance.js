const rootPrefix = '../../../..',
  TagModel = require(rootPrefix + '/app/models/mysql/Tag'),
  UserModel = require(rootPrefix + '/app/models/mysql/User'),
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  VideoTagsModel = require(rootPrefix + '/app/models/mysql/VideoTag'),
  VideoDetailModel = require(rootPrefix + '/app/models/mysql/VideoDetail'),
  VideoByIdCache = require(rootPrefix + '/lib/cacheManagement/multi/VideoByIds'),
  VideoContributorModel = require(rootPrefix + '/app/models/mysql/VideoContributor'),
  videoDetailConstants = require(rootPrefix + '/lib/globalConstant/videoDetail'),
  basicHelper = require(rootPrefix + '/helpers/basic'),
  shortToLongUrl = require(rootPrefix + '/lib/shortToLongUrl'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  videoConstants = require(rootPrefix + '/lib/globalConstant/video');

/**
 * Class to populate videos performance sheet in Google Sheets.
 *
 * @class VideosPerformance
 */
class VideosPerformance {
  /**
   * Constructor to populate videos performance sheet in Google Sheets.
   *
   * @constructor
   */
  constructor() {
    const oThis = this;

    oThis.totalRows = 0;
    oThis.videoData = null;
    oThis.videoDetails = [];
  }

  /**
   * Main performer for class.
   *
   * @returns {Promise<void>}
   */
  async perform() {
    const oThis = this;

    await oThis._performBatch();

    await oThis._processOutput();
  }

  /**
   * Perform batching.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _performBatch() {
    const oThis = this;

    const limit = 25;
    let offset = 0;

    while (true) {
      await oThis._fetchVideoDetails(limit, offset);
      // No more records present to migrate
      if (oThis.totalRows === 0) {
        break;
      }
      offset += limit;
    }
  }

  /**
   * Fetch video details.
   *
   * @param {number} limit
   * @param {number} offset
   *
   * @sets oThis.totalRows, oThis.videoData, oThis.videoDetails
   *
   * @returns {Promise<*>}
   * @private
   */
  async _fetchVideoDetails(limit, offset) {
    const oThis = this;

    const dbRows = await new VideoDetailModel()
      .select('*')
      .where(['status NOT IN (?)', videoDetailConstants.invertedStatuses[videoDetailConstants.deletedStatus]])
      .limit(limit)
      .offset(offset)
      .order_by('id desc')
      .fire();

    oThis.totalRows = dbRows.length;

    if (oThis.totalRows <= 0) {
      return;
    }

    const videoIds = [],
      creatorUserIds = [];
    for (let index = 0; index < oThis.totalRows; index++) {
      const videoDetail = dbRows[index];
      videoIds.push(videoDetail.video_id);
      creatorUserIds.push(videoDetail.creator_user_id);
    }

    const userMap = await new UserModel().fetchByIds(creatorUserIds);
    const videoContributorRows = await new VideoContributorModel()
      .select('*')
      .where({ video_id: videoIds })
      .group_by('video_id')
      .order_by('updated_at desc')
      .fire();

    const videoUrlMap = await oThis._getVideoUrl(videoIds);

    const videoTagsMap = await oThis._getTagsForVideo(videoIds);

    const videoContributorMap = {};
    for (let index = 0; index < videoContributorRows.length; index++) {
      const row = videoContributorRows[index];
      videoContributorMap[row.video_id] = row.updated_at;
    }

    for (let index = 0; index < oThis.totalRows; index++) {
      const videoDetail = dbRows[index],
        videoId = videoDetail.video_id,
        creatorUserId = videoDetail.creator_user_id;

      oThis.videoData = {
        creator_name: '',
        video_created_date: '',
        pepo_coins_recieved: 0,
        last_pepo_coin_recieved_on: 0,
        no_of_supporters_of_the_video: 0,
        video_url: '',
        video_tag1: '',
        video_tag2: '',
        video_tag3: ''
      };

      oThis.videoData.creator_name = userMap[creatorUserId].name;
      oThis.videoData.video_created_date = new Date(videoDetail.created_at * 1000); // Converted created_at into milliseconds
      oThis.videoData.pepo_coins_recieved = videoDetail.total_amount;
      oThis.videoData.last_pepo_coin_recieved_on = videoContributorMap[videoId]
        ? new Date(videoContributorMap[videoId] * 1000)
        : '';
      oThis.videoData.no_of_supporters_of_the_video = videoDetail.total_contributed_by;
      oThis.videoData.video_url = videoUrlMap[videoId] ? videoUrlMap[videoId] : '';

      if (CommonValidators.validateNonEmptyObject(videoTagsMap[videoId])) {
        oThis.videoData.video_tag1 = videoTagsMap[videoId][0] || '';
        oThis.videoData.video_tag2 = videoTagsMap[videoId][1] || '';
        oThis.videoData.video_tag3 = videoTagsMap[videoId][2] || '';
      }

      oThis.videoDetails.push(oThis.videoData);
    }
  }

  /**
   * Get video url.
   *
   * @param {array<number>} videoIds
   *
   * @returns {Promise<*>}
   * @private
   */
  async _getVideoUrl(videoIds) {
    const cacheRsp = await new VideoByIdCache({ ids: videoIds }).fetch();
    if (cacheRsp.isFailure()) {
      return Promise.reject(cacheRsp);
    }

    const urlMap = {};
    for (const videoId in cacheRsp.data) {
      const urlTemplate = cacheRsp.data[videoId].urlTemplate;
      urlMap[videoId] = shortToLongUrl.getFullUrl(urlTemplate, videoConstants.originalResolution);
    }

    return urlMap;
  }

  /**
   * Get video tags.
   *
   * @param {array<number>} videoIds
   *
   * @returns {Promise<*>}
   * @private
   */
  async _getTagsForVideo(videoIds) {
    const videoTagRows = await new VideoTagsModel()
      .select('tag_id, video_id')
      .where({ video_id: videoIds })
      .fire();

    const tagIds = [],
      tagVideosMap = {};
    for (let index = 0; index < videoTagRows.length; index++) {
      tagIds.push(videoTagRows[index].tag_id);
      tagVideosMap[videoTagRows[index].tag_id] = tagVideosMap[videoTagRows[index].tag_id] || [];
      tagVideosMap[videoTagRows[index].tag_id].push(videoTagRows[index].video_id);
    }

    let tagRows = [];

    if (tagIds.length > 0) {
      tagRows = await new TagModel()
        .select('name, id')
        .where(['id IN (?)', tagIds])
        .fire();
    }

    const videoTagsMap = {};
    for (let index = 0; index < tagRows.length; index++) {
      const row = tagRows[index];
      if (tagVideosMap[row.id]) {
        for (let ind = 0; ind < tagVideosMap[row.id].length; ind++) {
          const vid = tagVideosMap[row.id][ind];
          videoTagsMap[vid] = videoTagsMap[vid] || [];
          videoTagsMap[vid].push(row.name);
        }
      }
    }

    return videoTagsMap;
  }

  /**
   * Process output.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _processOutput() {
    const oThis = this;

    let csvContent =
      'creator_name, video_created_date, pepo_coins_recieved, last_pepo_coin_recieved_on, no_of_supporters_of_the_video, video_url, video_tag1, video_tag2, video_tag3\n';
    for (const id in oThis.extractedData) {
      csvContent += oThis.extractedData[id].name + ',' + oThis.extractedData[id].weight + ',\n';
    }

    for (let index = 0; index < oThis.videoDetails.length; index++) {
      const vd = oThis.videoDetails[index];
      csvContent +=
        vd.creator_name +
        ',' +
        vd.video_created_date +
        ',' +
        parseInt(basicHelper.convertWeiToNormal(vd.pepo_coins_recieved)) +
        ',' +
        vd.last_pepo_coin_recieved_on +
        ',' +
        vd.no_of_supporters_of_the_video +
        ',' +
        vd.video_url +
        ',' +
        vd.video_tag1 +
        ',' +
        vd.video_tag2 +
        ',' +
        vd.video_tag3 +
        '\n';
    }
    logger.log(csvContent);
  }
}

module.exports = VideosPerformance;
