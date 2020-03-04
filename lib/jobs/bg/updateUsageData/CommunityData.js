const fs = require('fs'),
  csvParser = require('csv-parser');

const rootPrefix = '../../../..',
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  ChannelModel = require(rootPrefix + '/app/models/mysql/channel/Channel'),
  ChannelStatModel = require(rootPrefix + '/app/models/mysql/channel/ChannelStat'),
  ChannelVideoModel = require(rootPrefix + '/app/models/mysql/channel/ChannelVideo'),
  GoogleSheetsUploadData = require(rootPrefix + '/lib/google/Sheet'),
  VideoDetailModel = require(rootPrefix + '/app/models/mysql/VideoDetail'),
  ReplyDetailModel = require(rootPrefix + '/app/models/mysql/ReplyDetail'),
  VideoContributorModel = require(rootPrefix + '/app/models/mysql/VideoContributor'),
  basicHelper = require(rootPrefix + '/helpers/basic'),
  s3Wrapper = require(rootPrefix + '/lib/aws/S3Wrapper'),
  coreConstants = require(rootPrefix + '/config/coreConstants'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  channelConstants = require(rootPrefix + '/lib/globalConstant/channel/channels'),
  channelVideosConstants = require(rootPrefix + '/lib/globalConstant/channel/channelVideos'),
  replyDetailConstant = require(rootPrefix + '/lib/globalConstant/replyDetail'),
  videoDetailConstant = require(rootPrefix + '/lib/globalConstant/videoDetail'),
  pepoUsageSheetNamesConstants = require(rootPrefix + '/lib/globalConstant/pepoUsageSheetNames');

// Declare variables.
const batchSize = 100;

/**
 * Class to populate user data sheet in Google Sheets.
 *
 * @class UserData
 */
class UserData {
  /**
   * Constructor to populate user data sheet in Google Sheets.
   *
   * @param {object} params
   *
   * @constructor
   */
  constructor(params) {
    const oThis = this;

    oThis.channelIds = [];
    oThis.channelData = {};
    oThis.videoData = {};
    oThis.finalData = {};
  }

  /**
   * Main performer for class.
   *
   * @returns {Promise<void>}
   */
  async perform() {
    const oThis = this;

    await oThis.fetchChannelVideoData();

    await oThis.fetchVideoDetails();

    await oThis.fetchPixelData();

    await oThis.uploadData();
  }

  /**
   * Fetch channel data and video ids of channel.
   *
   * @sets oThis.channelData
   *
   * @returns {Promise<void>}
   */
  async fetchChannelVideoData() {
    const oThis = this;

    const dbRows = await new ChannelModel()
      .select(['id', 'name', 'createdAt'])
      .where({ status: channelConstants.activeStatus })
      .order_by('id asc')
      .fire();

    for (let i = 0; i < dbRows.length; i++) {
      const dbRow = dbRows[i];
      const formattedData = new ChannelModel().formatDbData(dbRow);
      oThis.channelData[formattedData.id] = {
        id: formattedData.id,
        name: formattedData.name,
        createdAt: formattedData.createdAt,
        totalUsers: 0,
        totalVideos: 0,
        totalReplies: 0,
        totalTransactions: 0,
        lastVideoTime: null,
        lastReplyTime: null,
        lastTransactionTime: null,
        totalHalfWatchedVideo: 0,
        totalHalfWatchedReply: 0,
        lastHalfWatchedDateVideo: null,
        lastHalfWatchedDateReply: null
      };
      await oThis.fetchChannelVideos(formattedData.id);
      oThis.channelIds.push(formattedData.id);
    }

    const channelStatdbRows = await new ChannelStatModel()
      .select('*')
      .where({ channel_id: oThis.channelIds })
      .fire();

    for (let i = 0; i < channelStatdbRows.length; i++) {
      const dbRow = channelStatdbRows[i];
      const formattedData = new ChannelStatModel().formatDbData(dbRow);
      oThis.channelData[formattedData.channelId]['totalVideos'] = formattedData.totalVideos;
      oThis.channelData[formattedData.channelId]['totalUsers'] = formattedData.totalUsers;
    }
  }

  /**
   * Fetch video details.
   *
   * @sets oThis.videoData
   *
   * @returns {Promise<void>}
   */
  async fetchVideoDetails() {
    const oThis = this;
    const videoIds = Object.keys(oThis.videoData);

    while (true) {
      const videoIdBatch = videoIds.splice(0, batchSize);

      if (videoIdBatch.length === 0) {
        return;
      }

      const dbRows = await new VideoDetailModel()
        .select(['video_id', 'total_replies', 'total_transactions'])
        .where({ video_id: videoIdBatch, status: videoDetailConstant.activeStatus })
        .fire();

      for (let i = 0; i < dbRows.length; i++) {
        const dbRow = dbRows[i];
        const formattedData = new VideoDetailModel().formatDbData(dbRow);
        oThis.videoData[formattedData.videoId]['totalReplies'] = formattedData.totalReplies;
        oThis.videoData[formattedData.videoId]['totalTransactions'] = formattedData.totalTransactions;
      }

      const replyDbRows = await new ReplyDetailModel()
        .select('parent_id, max(created_at) as lastReplyTime')
        .where(['status != ?', replyDetailConstant.deletedStatus])
        .where({ parent_id: videoIdBatch })
        .group_by('parent_id')
        .fire();

      for (let i = 0; i < replyDbRows.length; i++) {
        const dbRow = replyDbRows[i];
        oThis.videoData[formattedData.parent_id]['lastReplyTime'] = dbRow.lastReplyTime;
      }

      const contributionDbRows = await new VideoContributorModel()
        .select('video_id, max(created_at) as lastTransactionTime')
        .where({ video_id: videoIdBatch })
        .group_by('video_id')
        .fire();

      for (let i = 0; i < contributionDbRows.length; i++) {
        const dbRow = contributionDbRows[i];
        oThis.videoData[formattedData.video_id]['lastTransactionTime'] = dbRow.lastTransactionTime;
      }
    }
  }

  /**
   * Fetch channel video ids.
   *
   * @sets oThis.videoData
   *
   * @returns {Promise<void>}
   */
  async fetchChannelVideos(channelId) {
    const oThis = this;

    let offset = 0;

    while (true) {
      const dbRows = await new ChannelVideoModel()
        .select(['channel_id', 'video_id', 'createdAt'])
        .where({ status: channelVideosConstants.activeStatus, channel_id: channelId })
        .order_by('id asc')
        .limit(batchSize)
        .offset(offset)
        .fire();

      if (dbRows.length == 0) {
        return;
      }

      for (let i = 0; i < dbRows.length; i++) {
        const dbRow = dbRows[i];
        const formattedData = new ChannelVideoModel().formatDbData(dbRow);
        oThis.videoData[formattedData.videoId] = oThis.videoData[formattedData.videoId] || { channelIds: [] };
        oThis.videoData[formattedData.videoId]['channelIds'].push(formattedData.channelId);
        oThis.videoData[formattedData.videoId]['createdAt'] = formattedData.createdAt;
      }

      offset = offset + batchSize;
    }
  }

  /**
   * Fetch all users data.
   *
   * @sets oThis.finalData
   *
   * @returns {Promise<void>}
   */
  async fetchPixelData() {
    const oThis = this;

    const bucket = coreConstants.S3_USER_ASSETS_BUCKET,
      channelFileKey = coreConstants.CHANNEL_DATA_S3_FILE_PATH,
      channelCsvPath = coreConstants.CHANNEL_DATA_LOCAL_FILE_PATH;

    await s3Wrapper.downloadObjectToDisk(bucket, channelFileKey, channelCsvPath);

    let videoWatchData = await oThis.parseCsvFile(channelCsvPath);
    oThis.processCsvDataForVideos(videoWatchData);
  }

  /**
   * Process csv data for videos
   * @return {*}
   */
  processCsvDataForVideos(parsedDataArray) {
    const oThis = this;

    if (parsedDataArray.length === 0) {
      logger.info('===== Pixel data is empty =====');

      return;
    }

    // Loop over parsed data to update video Data.
    for (let index = 0; index < parsedDataArray.length; index++) {
      const parsedDataRow = parsedDataArray[index],
        entityType = parsedDataRow.e_entity,
        rowTimestamp = new Date(parsedDataRow.timestamp);

      if (entityType == 'video') {
        const videoId = parsedDataRow.video_id;

        if (Number(videoId) > 0 && CommonValidators.validateNonEmptyObject(oThis.videoData[videoId])) {
          oThis.videoData[videoId]['totalHalfWatchedVideo'] = +parsedDataRow.total_videos_watched;
          oThis.videoData[videoId]['lastHalfWatchedDateVideo'] = rowTimestamp;
        }
      } else if (entityType == 'reply') {
        const videoId = parsedDataRow.parent_video_id;

        if (Number(videoId) > 0 && CommonValidators.validateNonEmptyObject(oThis.videoData[videoId])) {
          oThis.videoData[videoId]['totalHalfWatchedReply'] = +parsedDataRow.total_videos_watched;
          oThis.videoData[videoId]['lastHalfWatchedDateReply'] = rowTimestamp;
        }
      } else {
        throw new Error(`Invalid entityType-${entityType}`);
      }
    }
  }

  /**
   * Parse CSV file.
   *
   * @param csvFilePath
   * @return {Promise<any>}
   */
  async parseCsvFile(csvFilePath) {
    const oThis = this;

    const csvDataArray = [];

    return new Promise(function(onResolve) {
      try {
        // eslint-disable-next-line no-sync
        if (fs.existsSync(csvFilePath)) {
          fs.createReadStream(csvFilePath)
            .pipe(csvParser())
            .on('data', function(row) {
              csvDataArray.push(row);
            })
            .on('end', function() {
              onResolve(csvDataArray);
            });
        } else {
          return onResolve(csvDataArray);
        }
      } catch (err) {
        return onResolve(csvDataArray);
      }
    });
  }

  /**
   * Upload data to Google Sheets.
   *
   * @returns {Promise<void>}
   */
  async uploadData() {
    const oThis = this;

    for (const videoId in oThis.videoData) {
      const videoDetail = oThis.videoData[videoId];
      const channelIds = videoDetail.channelIds;

      for (let i = 0; i < channelIds.length; i++) {
        const channelId = channelIds[i];
        const channelDetail = oThis.channelData[channelId];
        channelDetail.totalReplies = channelDetail.totalReplies + videoDetail.totalReplies;
        channelDetail.totalTransactions = channelDetail.totalTransactions + videoDetail.totalTransactions;

        if (!channelDetail.lastVideoTime || channelDetail.lastVideoTime < videoDetail.createdAt) {
          channelDetail.lastVideoTime = videoDetail.createdAt;
        }

        if (!channelDetail.lastReplyTime || channelDetail.lastReplyTime < videoDetail.lastReplyTime) {
          channelDetail.lastReplyTime = videoDetail.lastReplyTime;
        }

        if (!channelDetail.lastTransactionTime || channelDetail.lastTransactionTime < videoDetail.lastTransactionTime) {
          channelDetail.lastTransactionTime = videoDetail.lastTransactionTime;
        }

        channelDetail.totalHalfWatchedVideo = channelDetail.totalHalfWatchedVideo + videoDetail.totalHalfWatchedVideo;
        channelDetail.totalHalfWatchedReply = channelDetail.totalHalfWatchedReply + videoDetail.totalHalfWatchedReply;

        if (
          !channelDetail.lastHalfWatchedDateVideo ||
          channelDetail.lastHalfWatchedDateVideo < videoDetail.lastHalfWatchedDateVideo
        ) {
          channelDetail.lastHalfWatchedDateVideo = videoDetail.lastHalfWatchedDateVideo;
        }

        if (
          !channelDetail.lastHalfWatchedDateReply ||
          channelDetail.lastHalfWatchedDateReply < videoDetail.lastHalfWatchedDateReply
        ) {
          channelDetail.lastHalfWatchedDateReply = videoDetail.lastHalfWatchedDateReply;
        }
      }
    }

    const dataToUpload = [];
    dataToUpload.push(oThis.rowKeys);

    // basicHelper.timeStampInMinutesToDateTillSeconds('')

    for (let i = 0; i < oThis.channelIds.length; i++) {
      const channelId = oThis.channelIds[i];
      const channelDetail = oThis.channelData[channelId];

      channelDetail.lastHalfWatchedDateVideo = channelDetail.lastHalfWatchedDateVideo
        ? channelDetail.lastHalfWatchedDateVideo.getTime() / 1000
        : null;

      channelDetail.lastHalfWatchedDateReply = channelDetail.lastHalfWatchedDateReply
        ? channelDetail.lastHalfWatchedDateReply.getTime() / 1000
        : null;

      const row = [
        channelDetail.id,
        channelDetail.name,
        oThis.datetimeInStr(channelDetail.createdAt),
        channelDetail.totalUsers,
        channelDetail.totalVideos,
        channelDetail.totalReplies,
        channelDetail.totalTransactions,
        channelDetail.totalHalfWatchedVideo,
        channelDetail.totalHalfWatchedReply,
        oThis.datetimeInStr(channelDetail.lastHalfWatchedDateVideo),
        oThis.datetimeInStr(channelDetail.lastHalfWatchedDateReply),
        oThis.datetimeInStr(channelDetail.lastVideoTime),
        oThis.datetimeInStr(channelDetail.lastReplyTime),
        oThis.datetimeInStr(channelDetail.lastTransactionTime)
      ];

      dataToUpload.push(row);
    }

    return new GoogleSheetsUploadData().upload(
      pepoUsageSheetNamesConstants.channelDataLifetimeSheetName,
      dataToUpload,
      pepoUsageSheetNamesConstants.usageReportNamesToGroupIdsMap[
        pepoUsageSheetNamesConstants.channelDataLifetimeSheetName
      ]
    );
  }

  datetimeInStr(timestamp) {
    const oThis = this;

    if (timestamp) {
      return basicHelper.timeStampInMinutesToDateTillSeconds(timestamp);
    } else {
      return '';
    }
  }

  /**
   * Returns row keys.
   *
   * @returns {*[]}
   */
  get rowKeys() {
    return [
      'community_id',
      'community_name',
      'creation_date',
      'total_members',
      'total_videos',
      'total_replies',
      'no_of_transactions',
      'videos_half_watched',
      'replies_half_watched',
      'last_half_video_watched_date',
      'last_half_reply_watched_date',
      'last_video_created_on',
      'last_reply_created_on',
      'last_transaction_date'
    ];
  }
}

module.exports = UserData;
