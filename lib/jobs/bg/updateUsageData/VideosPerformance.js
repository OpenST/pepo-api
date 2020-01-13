const rootPrefix = '../../../..',
  TagModel = require(rootPrefix + '/app/models/mysql/Tag'),
  UserModel = require(rootPrefix + '/app/models/mysql/User'),
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  GoogleSheetsUploadData = require(rootPrefix + '/lib/google/Sheet'),
  VideoTagsModel = require(rootPrefix + '/app/models/mysql/VideoTag'),
  ReplyDetailModel = require(rootPrefix + '/app/models/mysql/ReplyDetail'),
  VideoDetailModel = require(rootPrefix + '/app/models/mysql/VideoDetail'),
  VideoByIdCache = require(rootPrefix + '/lib/cacheManagement/multi/VideoByIds'),
  VideoContributorModel = require(rootPrefix + '/app/models/mysql/VideoContributor'),
  basicHelper = require(rootPrefix + '/helpers/basic'),
  shortToLongUrl = require(rootPrefix + '/lib/shortToLongUrl'),
  videoConstants = require(rootPrefix + '/lib/globalConstant/video'),
  replyDetailConstant = require(rootPrefix + '/lib/globalConstant/replyDetail'),
  videoDetailsConstants = require(rootPrefix + '/lib/globalConstant/videoDetail'),
  pepoUsageSheetNamesConstants = require(rootPrefix + '/lib/globalConstant/pepoUsageSheetNames');

/**
 * Class to populate videos performance sheet in Google Sheets.
 *
 * @class VideosPerformance
 */
class VideosPerformance {
  /**
   * Constructor to populate videos performance sheet in Google Sheets.
   *
   * @param {object} params
   * @param {number} [params.queryStartTimeStampInSeconds]
   * @param {number} [params.queryEndTimeStampInSeconds]
   *
   * @constructor
   */
  constructor(params) {
    const oThis = this;

    oThis.queryStartTimeStampInSeconds = params.queryStartTimeStampInSeconds || null;
    oThis.queryEndTimeStampInSeconds = params.queryEndTimeStampInSeconds || null;

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

    await oThis.performOperationInBatches();

    await oThis.uploadData();
  }

  /**
   * Perform batching.
   *
   * @returns {Promise<void>}
   */
  async performOperationInBatches() {
    const oThis = this;

    const limit = 25;
    let offset = 0;

    while (true) {
      await oThis.fetchVideoDetails(limit, offset);
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
   */
  async fetchVideoDetails(limit, offset) {
    const oThis = this;

    const whereClauseArray = [
      'status NOT IN (?)',
      videoDetailsConstants.invertedStatuses[videoDetailsConstants.deletedStatus]
    ];

    if (oThis.queryStartTimeStampInSeconds && oThis.queryEndTimeStampInSeconds) {
      whereClauseArray[0] += ' AND created_at > ? AND created_at < ?';
      whereClauseArray.push(oThis.queryStartTimeStampInSeconds, oThis.queryEndTimeStampInSeconds);
    }

    const dbRows = await new VideoDetailModel()
      .select('*')
      .where(whereClauseArray)
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

    const videoUrlMap = await oThis.getVideoUrl(videoIds);

    const videoTagsMap = await oThis.getTagsForVideo(videoIds);

    const parentIdToDistinctUserRepliesCountMap = await oThis.getDistinctUserRepliesCountOnVideos(videoIds);

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
        video_id: 0,
        all_tags: '',
        pepo_coins_recieved: 0,
        last_pepo_coin_recieved_on: 0,
        no_of_supporters_of_the_video: 0,
        total_replies_on_video: '',
        distinct_user_replies_on_video: '',
        video_tag1: '',
        video_tag2: '',
        video_tag3: '',
        video_url: ''
      };

      oThis.videoData.creator_name = userMap[creatorUserId].name;
      oThis.videoData.video_created_date = new Date(videoDetail.created_at * 1000); // Converted created_at into milliseconds.
      oThis.videoData.video_id = videoId;
      oThis.videoData.pepo_coins_recieved = videoDetail.total_amount;
      oThis.videoData.last_pepo_coin_recieved_on = videoContributorMap[videoId]
        ? new Date(videoContributorMap[videoId] * 1000)
        : '';
      oThis.videoData.no_of_supporters_of_the_video = videoDetail.total_contributed_by;
      oThis.videoData.video_url = videoUrlMap[videoId] ? videoUrlMap[videoId] : '';
      oThis.videoData.total_replies_on_video = videoDetail.total_replies;
      oThis.videoData.distinct_user_replies_on_video = parentIdToDistinctUserRepliesCountMap[videoId]
        ? parentIdToDistinctUserRepliesCountMap[videoId]
        : 0;

      if (CommonValidators.validateNonEmptyObject(videoTagsMap[videoId])) {
        oThis.videoData.video_tag1 = videoTagsMap[videoId][0] || '';
        oThis.videoData.video_tag2 = videoTagsMap[videoId][1] || '';
        oThis.videoData.video_tag3 = videoTagsMap[videoId][2] || '';
        oThis.videoData.all_tags = videoTagsMap[videoId].join('|');
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
   */
  async getVideoUrl(videoIds) {
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
   * Get distinct user replies count on videos.
   *
   * @param videoIds
   *
   * @returns {Promise<void>}
   */
  async getDistinctUserRepliesCountOnVideos(videoIds) {
    const dbRows = await new ReplyDetailModel()
      .select('parent_id, count(distinct(creator_user_id)) as distinct_user_replies_on_video')
      .where([
        'parent_id IN (?) AND status = ?',
        videoIds,
        replyDetailConstant.invertedStatuses[replyDetailConstant.activeStatus]
      ])
      .group_by('parent_id')
      .fire();

    const parentIdToDistinctUserRepliesCountMap = {};
    for (let index = 0; index < dbRows.length; index++) {
      let dbRow = dbRows[index];
      parentIdToDistinctUserRepliesCountMap[dbRow.parent_id] = dbRow.distinct_user_replies_on_video;
    }

    return parentIdToDistinctUserRepliesCountMap;
  }

  /**
   * Get video tags.
   *
   * @param {array<number>} videoIds
   *
   * @returns {Promise<*>}
   */
  async getTagsForVideo(videoIds) {
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
   * Upload data to Google Sheets.
   *
   * @returns {Promise<void>}
   */
  async uploadData() {
    const oThis = this;

    const dataToUpload = [];
    const rowKeys = [
      'creator_name',
      'video_created_date',
      'video_id',
      'all_tags',
      'pepo_coins_recieved',
      'last_pepo_coin_recieved_on',
      'no_of_supporters_of_the_video',
      'total_replies_on_video',
      'distinct_user_replies_on_video',
      'video_tag1',
      'video_tag2',
      'video_tag3',
      'video_url'
    ];
    dataToUpload.push(rowKeys);

    for (let index = 0; index < oThis.videoDetails.length; index++) {
      const vd = oThis.videoDetails[index];

      const row = [
        vd.creator_name,
        vd.video_created_date,
        vd.video_id,
        vd.all_tags,
        parseInt(basicHelper.convertWeiToNormal(vd.pepo_coins_recieved)),
        vd.last_pepo_coin_recieved_on,
        vd.no_of_supporters_of_the_video,
        vd.total_replies_on_video,
        vd.distinct_user_replies_on_video,
        vd.video_tag1,
        vd.video_tag2,
        vd.video_tag3,
        vd.video_url
      ];

      dataToUpload.push(row);
    }

    if (oThis.queryStartTimeStampInSeconds && oThis.queryEndTimeStampInSeconds) {
      const timeDifference = oThis.queryEndTimeStampInSeconds - oThis.queryStartTimeStampInSeconds;

      switch (timeDifference) {
        case 7 * 24 * 60 * 60: {
          // 7 days.
          return new GoogleSheetsUploadData().upload(
            pepoUsageSheetNamesConstants.videosStatsLastSevenDaysSheetName,
            dataToUpload,
            pepoUsageSheetNamesConstants.usageReportNamesToGroupIdsMap[
              pepoUsageSheetNamesConstants.videosStatsLastSevenDaysSheetName
            ]
          );
        }
        case 24 * 60 * 60: {
          // 24 hours.
          return new GoogleSheetsUploadData().upload(
            pepoUsageSheetNamesConstants.videosStatsLastTwentyFourHoursSheetName,
            dataToUpload,
            pepoUsageSheetNamesConstants.usageReportNamesToGroupIdsMap[
              pepoUsageSheetNamesConstants.videosStatsLastTwentyFourHoursSheetName
            ]
          );
        }
        default: {
          throw new Error('Invalid time differences.');
        }
      }
    } else {
      return new GoogleSheetsUploadData().upload(
        pepoUsageSheetNamesConstants.videosStatsLifetimeSheetName,
        dataToUpload,
        pepoUsageSheetNamesConstants.usageReportNamesToGroupIdsMap[
          pepoUsageSheetNamesConstants.videosStatsLifetimeSheetName
        ]
      );
    }
  }
}

module.exports = VideosPerformance;
