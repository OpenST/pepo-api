const rootPrefix = '../../../..',
  TagModel = require(rootPrefix + '/app/models/mysql/Tag'),
  UserModel = require(rootPrefix + '/app/models/mysql/User'),
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  GoogleSheetsUploadData = require(rootPrefix + '/lib/google/Sheet'),
  VideoTagsModel = require(rootPrefix + '/app/models/mysql/VideoTag'),
  TransactionModel = require(rootPrefix + '/app/models/mysql/Transaction'),
  ReplyDetailModel = require(rootPrefix + '/app/models/mysql/ReplyDetail'),
  VideoDetailModel = require(rootPrefix + '/app/models/mysql/VideoDetail'),
  VideoByIdCache = require(rootPrefix + '/lib/cacheManagement/multi/VideoByIds'),
  VideoContributorModel = require(rootPrefix + '/app/models/mysql/VideoContributor'),
  basicHelper = require(rootPrefix + '/helpers/basic'),
  shortToLongUrl = require(rootPrefix + '/lib/shortToLongUrl'),
  videoConstants = require(rootPrefix + '/lib/globalConstant/video'),
  replyDetailConstant = require(rootPrefix + '/lib/globalConstant/replyDetail'),
  transactionConstants = require(rootPrefix + '/lib/globalConstant/transaction'),
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
   * @param {boolean} [params.allVideosButOnlyTimeIntervalData]
   * @param {String} [params.sheetName] - Google sheet name which needs to be updated.
   * @param {number} [params.sheetGid] - Google sheet gid which needs to be updated.
   *
   * @constructor
   */
  constructor(params) {
    const oThis = this;

    oThis.queryStartTimeStampInSeconds = params.queryStartTimeStampInSeconds || null;
    oThis.queryEndTimeStampInSeconds = params.queryEndTimeStampInSeconds || null;
    oThis.allVideosButOnlyTimeIntervalData = params.allVideosButOnlyTimeIntervalData || false;
    oThis.sheetName = params.sheetName;
    oThis.sheetGid = params.sheetGid;

    oThis.videoIdToDataFromTransactionsMap = {};
    oThis.totalRows = 0;
    oThis.videoDetails = [];
    oThis.videoIdByTransactionData = {};
  }

  /**
   * Main performer for class.
   *
   * @returns {Promise<void>}
   */
  async perform() {
    const oThis = this;

    if(oThis.allVideosButOnlyTimeIntervalData) {
      // get all transactions in that interval which were done on a video
      oThis.videoIdByTransactionData = await oThis.fetchTransactionDetails();
    }

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

    await oThis.uploadData();
  }

  /**
   * Fetch transaction details.
   *
   * @returns {Promise<object>}
   */
  async fetchTransactionDetails() {
    const oThis = this;

    const videoIdByTransactionData = {};

    const limit = 500;
    let offset = 0;

    while (true) {
      const whereClauseArray = [
        'status = ?',
        transactionConstants.invertedStatuses[transactionConstants.doneStatus]
      ];

      const kindArray = [
        transactionConstants.invertedKinds[transactionConstants.userTransactionKind]
      ];

      if (oThis.queryStartTimeStampInSeconds && oThis.queryEndTimeStampInSeconds) {
        whereClauseArray[0] += ' AND created_at > (?) AND created_at < (?)';
        whereClauseArray.push(oThis.queryStartTimeStampInSeconds, oThis.queryEndTimeStampInSeconds);
      }

      const transactionRows = await new TransactionModel()
        .select(
          'from_user_id, amount, extra_data, created_at'
        )
        .where(whereClauseArray)
        .where({ kind: kindArray })
        .where(['extra_data LIKE "%videoId%"'])
        .limit(limit)
        .offset(offset)
        .order_by('id asc')
        .fire();

      // No more records present to migrate
      if (transactionRows.length === 0) {
        break;
      }
      offset += limit;

      for (let index = 0; index < transactionRows.length; index++) {
        const transactionRow = transactionRows[index];

        const extraData = JSON.parse(transactionRow.extra_data || {});
        const videoId = extraData.videoId;

        videoIdByTransactionData[videoId] = videoIdByTransactionData[videoId] || {
          pepoCoinsRecieved: 0,
          lastPepoCoinRecievedOn: '',
          supportersMap: {}
        };

        videoIdByTransactionData[videoId].pepoCoinsRecieved += transactionRow.amount;
        videoIdByTransactionData[videoId].lastPepoCoinRecievedOn = transactionRow.created_at;
        videoIdByTransactionData[videoId].supportersMap[transactionRow.from_user_id] = 1;
      }
    }

    return videoIdByTransactionData;
  }

  /**
   * Fetch video details.
   *
   * @param {number} limit
   * @param {number} offset
   *
   * @sets oThis.totalRows, oThis.videoDetails
   *
   * @returns {Promise<*>}
   */
  async fetchVideoDetails(limit, offset) {
    const oThis = this;

    const whereClauseArray = [
      'status NOT IN (?)',
      videoDetailsConstants.invertedStatuses[videoDetailsConstants.deletedStatus]
    ];

    if (!oThis.allVideosButOnlyTimeIntervalData &&
      oThis.queryStartTimeStampInSeconds &&
      oThis.queryEndTimeStampInSeconds) {
      whereClauseArray[0] += ' AND created_at > ? AND created_at < ?';
      whereClauseArray.push(oThis.queryStartTimeStampInSeconds, oThis.queryEndTimeStampInSeconds);
    }

    // Fetch videos for the batch.
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
    const videoUrlMap = await oThis.getVideoUrl(videoIds);
    const videoTagsMap = await oThis.getTagsForVideo(videoIds);

    const videoIdToDistinctUserRepliesCountMap = await oThis.getDistinctUserRepliesCountOnVideos(videoIds);

    const totalRepliesCountOnVideos = await oThis.getTotalRepliesCountOnVideos(videoIds);

    const videoContributorRows = await new VideoContributorModel()
      .select('*')
      .where({ video_id: videoIds })
      .group_by('video_id')
      .order_by('updated_at desc')
      .fire();

    const videoContributorMap = {};
    for (let index = 0; index < videoContributorRows.length; index++) {
      const row = videoContributorRows[index];
      videoContributorMap[row.video_id] = row.updated_at;
    }

    for (let index = 0; index < oThis.totalRows; index++) {
      const videoDetail = dbRows[index],
        videoId = videoDetail.video_id,
        creatorUserId = videoDetail.creator_user_id;

      let videoData = {
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

      videoData.creator_name = userMap[creatorUserId].name;

      videoData.video_url = videoUrlMap[videoId] ? videoUrlMap[videoId] : '';

      if (CommonValidators.validateNonEmptyObject(videoTagsMap[videoId])) {
        videoData.video_tag1 = videoTagsMap[videoId][0] || '';
        videoData.video_tag2 = videoTagsMap[videoId][1] || '';
        videoData.video_tag3 = videoTagsMap[videoId][2] || '';
        videoData.all_tags = videoTagsMap[videoId].join('|');
      }

      videoData.video_created_date = new Date(videoDetail.created_at * 1000); // Converted created_at into milliseconds.
      videoData.video_id = videoId;

      // Following will be fetched from transactions
      if(oThis.allVideosButOnlyTimeIntervalData) {
        let videoTxData = oThis.videoIdByTransactionData[videoId] || {};
        videoData.pepo_coins_recieved = videoTxData.pepoCoinsRecieved || 0;
        videoData.last_pepo_coin_recieved_on = videoTxData.lastPepoCoinRecievedOn ?
          new Date(videoTxData.lastPepoCoinRecievedOn * 1000)
          : '';

        videoData.no_of_supporters_of_the_video = Object.keys(videoTxData.supportersMap || {}).length;
      } else {
        videoData.pepo_coins_recieved = videoDetail.total_amount;
        videoData.last_pepo_coin_recieved_on = videoContributorMap[videoId]
          ? new Date(videoContributorMap[videoId] * 1000)
          : '';
        videoData.no_of_supporters_of_the_video = videoDetail.total_contributed_by;
      }

      videoData.total_replies_on_video = totalRepliesCountOnVideos[videoId] || 0;
      videoData.distinct_user_replies_on_video = videoIdToDistinctUserRepliesCountMap[videoId] || 0;

      oThis.videoDetails.push(videoData);
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
    const oThis = this;

    let query = new ReplyDetailModel()
      .select('parent_id, count(distinct(creator_user_id)) as distinct_user_replies_on_video')
      .where([
        'parent_id IN (?) AND status = ?',
        videoIds,
        replyDetailConstant.invertedStatuses[replyDetailConstant.activeStatus]
      ])
      .group_by('parent_id');

    if(oThis.allVideosButOnlyTimeIntervalData) {
      query = query.where([
        'created_at > ? AND created_at < ?',
        oThis.queryStartTimeStampInSeconds,
        oThis.queryEndTimeStampInSeconds
      ]);
    }

    const dbRows = await query.fire();

    const parentIdToDistinctUserRepliesCountMap = {};
    for (let index = 0; index < dbRows.length; index++) {
      let dbRow = dbRows[index];
      parentIdToDistinctUserRepliesCountMap[dbRow.parent_id] = dbRow.distinct_user_replies_on_video;
    }

    return parentIdToDistinctUserRepliesCountMap;
  }

  /**
   * Get total replies count on videos.
   *
   * @param videoIds
   *
   * @returns {Promise<void>}
   */
  async getTotalRepliesCountOnVideos(videoIds) {
    const oThis = this;

    let query = new ReplyDetailModel()
      .select('parent_id, count(*) as total_replies_on_video')
      .where([
        'parent_id IN (?) AND status = ?',
        videoIds,
        replyDetailConstant.invertedStatuses[replyDetailConstant.activeStatus]
      ])
      .group_by('parent_id');

    if(oThis.allVideosButOnlyTimeIntervalData) {
      query = query.where([
        'created_at > ? AND created_at < ?',
        oThis.queryStartTimeStampInSeconds,
        oThis.queryEndTimeStampInSeconds
      ]);
    }

    const dbRows = await query.fire();

    const videoIdToTotalRepliesMap = {};
    for (let index = 0; index < dbRows.length; index++) {
      let dbRow = dbRows[index];
      videoIdToTotalRepliesMap[dbRow.parent_id] = dbRow.total_replies_on_video;
    }

    return videoIdToTotalRepliesMap;
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

    if (oThis.sheetName && oThis.sheetGid) {
      return new GoogleSheetsUploadData().upload(oThis.sheetName, dataToUpload, oThis.sheetGid);
    } else if (oThis.queryStartTimeStampInSeconds && oThis.queryEndTimeStampInSeconds) {
      const timeDifference = oThis.queryEndTimeStampInSeconds - oThis.queryStartTimeStampInSeconds;

      switch (timeDifference) {
        case 7 * 24 * 60 * 60: {
          // 7 days sheet to be updated
          return new GoogleSheetsUploadData().upload(
            pepoUsageSheetNamesConstants.videosStatsLastSevenDaysSheetName,
            dataToUpload,
            pepoUsageSheetNamesConstants.usageReportNamesToGroupIdsMap[
              pepoUsageSheetNamesConstants.videosStatsLastSevenDaysSheetName
              ]
          );
        }
        case 24 * 60 * 60: {
          // 24 hours sheet to be updated
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
      // life time sheet to be updated.
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
