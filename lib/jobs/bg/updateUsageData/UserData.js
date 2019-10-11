const fs = require('fs'),
  csvParser = require('csv-parser');

const rootPrefix = '../../../..',
  UserModel = require(rootPrefix + '/app/models/mysql/User'),
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  GoogleSheetsUploadData = require(rootPrefix + '/lib/google/Sheet'),
  UserStatModel = require(rootPrefix + '/app/models/mysql/UserStat'),
  InviteCodeModel = require(rootPrefix + '/app/models/mysql/InviteCode'),
  UserDeviceModel = require(rootPrefix + '/app/models/mysql/UserDevice'),
  VideoDetailModel = require(rootPrefix + '/app/models/mysql/VideoDetail'),
  FiatPaymentModel = require(rootPrefix + '/app/models/mysql/FiatPayment'),
  TwitterUserModel = require(rootPrefix + '/app/models/mysql/TwitterUser'),
  TransactionModel = require(rootPrefix + '/app/models/mysql/Transaction'),
  basicHelper = require(rootPrefix + '/helpers/basic'),
  inviteCodeConstants = require(rootPrefix + '/lib/globalConstant/inviteCode'),
  fiatPaymentConstants = require(rootPrefix + '/lib/globalConstant/fiatPayment'),
  transactionConstants = require(rootPrefix + '/lib/globalConstant/transaction'),
  s3Wrapper = require(rootPrefix + '/lib/aws/S3Wrapper'),
  coreConstants = require(rootPrefix + '/config/coreConstants'),
  pepoUsageSheetNamesConstants = require(rootPrefix + '/lib/globalConstant/pepoUsageSheetNames');

// Declare variables.
const batchSize = 50;

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
   * @param {number} [params.queryStartTimeStampInSeconds]
   * @param {number} [params.queryEndTimeStampInSeconds]
   *
   * @constructor
   */
  constructor(params) {
    const oThis = this;

    oThis.queryStartTimeStampInSeconds = params.queryStartTimeStampInSeconds || null;
    oThis.queryEndTimeStampInSeconds = params.queryEndTimeStampInSeconds || null;

    oThis.finalData = {};
  }

  /**
   * Main performer for class.
   *
   * @returns {Promise<void>}
   */
  async perform() {
    const oThis = this;

    await oThis.fetchUserDetails();

    await oThis.uploadData();
  }

  /**
   * Fetch all users data.
   *
   * @sets oThis.finalData
   *
   * @returns {Promise<void>}
   */
  async fetchUserDetails() {
    const oThis = this;

    const limit = batchSize;

    let page = 0,
      offset = 0,
      isMoreDataPresent = true;

    while (isMoreDataPresent) {
      const batchdata = {};
      const userDbRows = await new UserModel()
        .select('id, created_at, name, user_name, email')
        .limit(limit)
        .offset(offset)
        .fire();

      if (userDbRows.length === 0) {
        isMoreDataPresent = false;
      } else {
        for (let index = 0; index < userDbRows.length; index++) {
          const userRow = userDbRows[index];

          batchdata[userRow.id] = {
            user_id: userRow.id,
            sign_up_date: basicHelper.timeStampInMinutesToDate(userRow.created_at),
            name: userRow.name,
            user_name: userRow.user_name,
            twitter_handle: '',
            email: userRow.email || '',
            is_creator: 0,
            inviter_code_id: '',
            custom_invite_code: '',
            inviter_user_name: '',
            code: '',
            count: 0,
            first_video_created_on: '',
            last_video_created_on: '',
            kind: '',
            amount_raised: 0,
            amount_spent: 0,
            topup_amount: 0,
            last_topup_date: '',
            no_of_transactions: 0,
            last_transaction_date: '',
            videos_watched: 0,
            last_video_watched_date: ''
          };
        }

        page++;
        offset = page * limit;
        const batchedDataWithInviteCode = await oThis.fetchInviteCodeDetails(batchdata),
          batchedDataWithUserVideoDetail = await oThis.fetchUserVideoDetails(batchedDataWithInviteCode),
          batchedDataWithUserStats = await oThis.fetchUserStats(batchedDataWithUserVideoDetail),
          batchedDataWithTopupInfo = await oThis.fetchTopUpInformation(batchedDataWithUserStats),
          batchedDataWithTwitterDetails = await oThis.fetchTwitterDetails(batchedDataWithTopupInfo),
          batchedDataWithTransactionDetails = await oThis.fetchTransactionDetails(batchedDataWithTwitterDetails),
          batchedDataWithVideosWatchedDetails = await oThis.fetchVideoStatsDetails(batchedDataWithTransactionDetails);

        Object.assign(oThis.finalData, batchedDataWithVideosWatchedDetails);
      }
    }
  }

  /**
   * Fetch invite code details.
   *
   * @param {array<number>} batchdata
   *
   * @returns {Promise<array<number>>}
   */
  async fetchInviteCodeDetails(batchdata) {
    const oThis = this;

    const userIds = Object.keys(batchdata);

    // Fetch invite code details by userId.
    const inviteCodeByUserIdsRows = await new InviteCodeModel()
      .select('user_id, invite_limit, inviter_code_id')
      .where(['user_id IN (?)', userIds])
      .fire();

    const inviterCodeIdToUserIdMap = {};

    for (let index = 0; index < inviteCodeByUserIdsRows.length; index++) {
      const inviteCodeRow = inviteCodeByUserIdsRows[index];

      batchdata[inviteCodeRow.user_id].is_creator = inviteCodeRow.invite_limit <= 0 ? 1 : 0;
      batchdata[inviteCodeRow.user_id].inviter_code_id = inviteCodeRow.inviter_code_id;

      if (inviteCodeRow.inviter_code_id) {
        inviterCodeIdToUserIdMap[inviteCodeRow.inviter_code_id] =
          inviterCodeIdToUserIdMap[inviteCodeRow.inviter_code_id] || [];
        inviterCodeIdToUserIdMap[inviteCodeRow.inviter_code_id].push(inviteCodeRow.user_id);
      }
    }
    const inviteCodeIds = Object.keys(inviterCodeIdToUserIdMap);

    if (inviteCodeIds.length !== 0) {
      // Fetch invite code details by invite code table ids.
      const inviteCodeByIdsRows = await new InviteCodeModel()
        .select('id, code, user_id, kind')
        .where(['id IN (?)', inviteCodeIds])
        .fire();

      for (let index = 0; index < inviteCodeByIdsRows.length; index++) {
        const inviteCodeRow = inviteCodeByIdsRows[index];

        if (Number(inviteCodeRow.kind) === Number(inviteCodeConstants.invertedKinds[inviteCodeConstants.nonUserKind])) {
          const userIdsForThisCode = inviterCodeIdToUserIdMap[inviteCodeRow.id];
          for (let ind = 0; ind < userIdsForThisCode.length; ind++) {
            batchdata[userIdsForThisCode[ind]].custom_invite_code = inviteCodeRow.code;
          }
        } else if (inviteCodeRow.user_id) {
          const userIdsForThisCode = inviterCodeIdToUserIdMap[inviteCodeRow.id];
          for (let ind = 0; ind < userIdsForThisCode.length; ind++) {
            batchdata[userIdsForThisCode[ind]].inviter_user_id = inviteCodeRow.user_id;
            // Fetch user id.
            batchdata[userIdsForThisCode[ind]].inviter_user_name = await oThis.fetchUserName(inviteCodeRow.user_id);
          }
        }
      }
    }

    return batchdata;
  }

  /**
   * Fetch user name.
   *
   * @param {number} userId
   *
   * @returns {Promise<*>}
   */
  async fetchUserName(userId) {
    const dbRow = await new UserModel()
      .select(['name'])
      .where(['id = ?', userId])
      .fire();

    return dbRow[0].name;
  }

  /**
   * Fetch user video details.
   *
   * @param {array<number>} batchdata
   *
   * @returns {Promise<array<number>>}
   */
  async fetchUserVideoDetails(batchdata) {
    const oThis = this;

    const userIds = Object.keys(batchdata);

    const whereClauseArray = ['creator_user_id IN (?)', userIds];

    if (oThis.queryStartTimeStampInSeconds && oThis.queryEndTimeStampInSeconds) {
      whereClauseArray[0] += ' AND created_at > (?) AND created_at < (?)';
      whereClauseArray.push(oThis.queryStartTimeStampInSeconds, oThis.queryEndTimeStampInSeconds);
    }

    const videoDetailRows = await new VideoDetailModel()
      .select(
        'creator_user_id, created_at, MIN(created_at) AS firstVideoCreation, MAX(created_at) AS lastVideoCreation, COUNT(1) AS count'
      )
      .where(whereClauseArray)
      .group_by('creator_user_id')
      .order_by('created_at ASC')
      .fire();

    for (let index = 0; index < videoDetailRows.length; index++) {
      const videoDetailRow = videoDetailRows[index];

      if (videoDetailRow.creator_user_id) {
        batchdata[videoDetailRow.creator_user_id] = Object.assign(batchdata[videoDetailRow.creator_user_id], {
          count: videoDetailRow.count,
          first_video_created_on: basicHelper.timeStampInMinutesToDateTillSeconds(videoDetailRow.firstVideoCreation),
          last_video_created_on: basicHelper.timeStampInMinutesToDateTillSeconds(videoDetailRow.lastVideoCreation)
        });
      }
    }

    return batchdata;
  }

  /**
   * Fetch user stats.
   *
   * @param {array<number>} batchedData
   *
   * @returns {Promise<array<number>>}
   */
  async fetchUserStats(batchedData) {
    const oThis = this;

    const userIds = Object.keys(batchedData);

    const whereClauseArray = ['user_id IN (?)', userIds];

    if (oThis.queryStartTimeStampInSeconds && oThis.queryEndTimeStampInSeconds) {
      whereClauseArray[0] += ' AND created_at > (?) AND created_at < (?)';
      whereClauseArray.push(oThis.queryStartTimeStampInSeconds, oThis.queryEndTimeStampInSeconds);
    }

    const userStatRows = await new UserStatModel()
      .select('user_id, total_amount_raised, total_amount_spent')
      .where(whereClauseArray)
      .fire();

    for (let index = 0; index < userStatRows.length; index++) {
      const userStatRow = userStatRows[index];

      batchedData[userStatRow.user_id] = Object.assign(batchedData[userStatRow.user_id], {
        amount_raised: userStatRow.total_amount_raised,
        amount_spent: userStatRow.total_amount_spent
      });
    }

    return batchedData;
  }

  /**
   * Fetch topup information for user.
   *
   * @param {array<number>} batchedData
   *
   * @returns {Promise<array<number>>}
   */
  async fetchTopUpInformation(batchedData) {
    const oThis = this;

    const userIds = Object.keys(batchedData);

    const whereClauseArray = [
      'status = ? AND kind = ? AND from_user_id IN (?)',
      fiatPaymentConstants.invertedStatuses[fiatPaymentConstants.pepoTransferSuccessStatus],
      fiatPaymentConstants.invertedKinds[fiatPaymentConstants.topUpKind],
      userIds
    ];

    if (oThis.queryStartTimeStampInSeconds && oThis.queryEndTimeStampInSeconds) {
      whereClauseArray[0] += ' AND created_at > (?) AND created_at < (?)';
      whereClauseArray.push(oThis.queryStartTimeStampInSeconds, oThis.queryEndTimeStampInSeconds);
    }

    const fiatPaymentRows = await new FiatPaymentModel()
      .select('from_user_id, sum(amount) as amount, created_at')
      .where(whereClauseArray)
      .group_by('from_user_id')
      .order_by('created_at DESC')
      .fire();

    for (let index = 0; index < fiatPaymentRows.length; index++) {
      const fiatPaymentRow = fiatPaymentRows[index];

      if (fiatPaymentRow.from_user_id) {
        if (fiatPaymentRow.amount) {
          batchedData[fiatPaymentRow.from_user_id].topup_amount = fiatPaymentRow.amount;
        }
        batchedData[fiatPaymentRow.from_user_id].last_topup_date = basicHelper.timeStampInMinutesToDate(
          fiatPaymentRow.created_at
        );
      }
    }

    return batchedData;
  }

  /**
   * Fetch twitter details.
   *
   * @param {array<number>} batchedData
   *
   * @returns {Promise<array<number>>}
   */
  async fetchTwitterDetails(batchedData) {
    const userIds = Object.keys(batchedData);

    const twitterDbRows = await new TwitterUserModel()
      .select('user_id, handle')
      .where(['user_id IN (?)', userIds])
      .fire();

    for (let index = 0; index < twitterDbRows.length; index++) {
      const twitterUserRow = twitterDbRows[index];

      batchedData[twitterUserRow.user_id].twitter_handle = twitterUserRow.handle;
    }

    return batchedData;
  }

  /**
   * Fetch transaction details.
   *
   * @param {array<number>} batchedData
   *
   * @returns {Promise<array<number>>}
   */
  async fetchTransactionDetails(batchedData) {
    const oThis = this;

    const userIds = Object.keys(batchedData);

    const whereClauseArray = [
      'from_user_id IN (?) AND status = ?',
      userIds,
      transactionConstants.invertedStatuses[transactionConstants.doneStatus]
    ];

    if (oThis.queryStartTimeStampInSeconds && oThis.queryEndTimeStampInSeconds) {
      whereClauseArray[0] += ' AND created_at > (?) AND created_at < (?)';
      whereClauseArray.push(oThis.queryStartTimeStampInSeconds, oThis.queryEndTimeStampInSeconds);
    }

    const transactionRows = await new TransactionModel()
      .select('from_user_id, count(*) as transactionCount, max(created_at) as lastTransactionCreation')
      .where(whereClauseArray)
      .group_by(['from_user_id'])
      .fire();

    for (let index = 0; index < transactionRows.length; index++) {
      const transactionRow = transactionRows[index];

      if (transactionRow.from_user_id) {
        batchedData[transactionRow.from_user_id].no_of_transactions = transactionRow.transactionCount;
        if (transactionRow.lastTransactionCreation) {
          batchedData[transactionRow.from_user_id].last_transaction_date = basicHelper.timeStampInMinutesToDate(
            transactionRow.lastTransactionCreation
          );
        }
      }
    }

    return batchedData;
  }

  /**
   * Fetch videos watched details.
   *
   * @param {array<number>} batchedData
   *
   * @returns {Promise<array<number>>}
   */
  async fetchVideoStatsDetails(batchedData) {
    const oThis = this,
      bucket = coreConstants.S3_USER_ASSETS_BUCKET,
      key = coreConstants.PA_VIDEO_PIXEL_DATA_S3_FILE_PATH,
      downloadPath = coreConstants.PA_VIDEO_PIXEL_DATA_APP_FILE_PATH;

    await s3Wrapper.downloadObjectToDisk(bucket, key, downloadPath);

    const parsedDataArray = await oThis.parseCsvFile();
    if (parsedDataArray.length === 0) {
      return batchedData;
    }

    const deviceIdToVideoDetailsMap = {};

    // Loop over parsed data to create deviceId to video details map.
    for (let index = 0; index < parsedDataArray.length; index++) {
      const parsedDataRow = parsedDataArray[index];

      deviceIdToVideoDetailsMap[parsedDataRow.device_id] = deviceIdToVideoDetailsMap[parsedDataRow.device_id] || {
        videoIds: [],
        latestTimestamp: parsedDataRow.timestamp
      };

      deviceIdToVideoDetailsMap[parsedDataRow.device_id].videoIds.push(parsedDataRow.video_id);

      if (parsedDataRow.timestamp > deviceIdToVideoDetailsMap[parsedDataRow.device_id].latestTimestamp) {
        deviceIdToVideoDetailsMap[parsedDataRow.device_id].latestTimestamp = parsedDataRow.timestamp;
      }
    }

    // We need unique videoIds.
    for (const deviceId in deviceIdToVideoDetailsMap) {
      deviceIdToVideoDetailsMap[deviceId].videoIds = [...new Set(deviceIdToVideoDetailsMap[deviceId].videoIds)];
    }

    const userIds = Object.keys(batchedData);

    // Fetch all devices for the users.
    const userDevicesRow = await new UserDeviceModel()
      .select('user_id, device_id')
      .where({ user_id: userIds })
      .fire();

    const userIdToDeviceIdsArray = {};

    // Loop over DB data to create userId to deviceIds map.
    for (let index = 0; index < userDevicesRow.length; index++) {
      const userDeviceRow = userDevicesRow[index];

      userIdToDeviceIdsArray[userDeviceRow.user_id] = userIdToDeviceIdsArray[userDeviceRow.user_id] || [];
      userIdToDeviceIdsArray[userDeviceRow.user_id].push(userDeviceRow.device_id);
    }

    for (const userId in userIdToDeviceIdsArray) {
      const deviceIds = userIdToDeviceIdsArray[userId];

      let combinedVideoIds = [],
        latestTimestamp = new Date(0);

      for (let index = 0; index < deviceIds.length; index++) {
        const deviceId = deviceIds[index];

        // There is a possibility that the deviceId obtained from the DB does not exist in the CSV.
        if (!CommonValidators.validateNonEmptyObject(deviceIdToVideoDetailsMap[deviceId])) {
          combinedVideoIds = combinedVideoIds.concat(deviceIdToVideoDetailsMap[deviceId].videoIds);

          if (deviceIdToVideoDetailsMap[deviceId].latestTimestamp > latestTimestamp) {
            latestTimestamp = deviceIdToVideoDetailsMap[deviceId].latestTimestamp;
          }
        }
      }

      batchedData[userId].videos_watched = combinedVideoIds.length;
      if (latestTimestamp.toTimeString() !== new Date(0).toTimeString()) {
        batchedData[userId].last_video_watched_date = basicHelper.timeStampInMinutesToDate(latestTimestamp);
      }
    }

    return batchedData;
  }

  /**
   * Parse CSV file.
   *
   * @returns {Promise<array>}
   */
  async parseCsvFile() {
    const oThis = this;

    const csvDataArray = [];

    const videoWatchedByDevicesCsvFilePath = coreConstants.PA_VIDEO_PIXEL_DATA_APP_FILE_PATH;

    try {
      // eslint-disable-next-line no-sync
      if (fs.existsSync(videoWatchedByDevicesCsvFilePath)) {
        fs.createReadStream(videoWatchedByDevicesCsvFilePath)
          .pipe(csvParser())
          .on('data', function(row) {
            if (oThis.queryStartTimeStampInSeconds && oThis.queryEndTimeStampInSeconds) {
              const parsedRowTimestamp = new Date(row.timestamp);
              if (
                parsedRowTimestamp > new Date(oThis.queryStartTimeStampInSeconds) &&
                parsedRowTimestamp < new Date(oThis.queryEndTimeStampInSeconds)
              ) {
                csvDataArray.push(row);
              } else {
                // Do nothing. No need to include this row.
              }
            }
            csvDataArray.push(row);
          });
      } else {
        return [];
      }
    } catch (err) {
      return [];
    }

    return csvDataArray;
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
      'user_id',
      'sign_up_date',
      'name',
      'email',
      'twitter_handle',
      'is_creator',
      'inviter_user_name',
      'custom_invite_code',
      'total_videos',
      'first_video_created_on',
      'last_video_created_on',
      'topup_amount',
      'last_topup_date',
      'amount_raised',
      'amount_spent',
      'no_of_transactions',
      'last_transaction_date',
      'videos_watched',
      'last_video_watched_date'
    ];
    dataToUpload.push(rowKeys);

    for (const userId in oThis.finalData) {
      const individualUserData = oThis.finalData[userId];

      const row = [
        userId,
        individualUserData.sign_up_date,
        individualUserData.name,
        individualUserData.email,
        individualUserData.twitter_handle,
        individualUserData.is_creator,
        individualUserData.inviter_user_name,
        individualUserData.custom_invite_code,
        individualUserData.count,
        individualUserData.first_video_created_on,
        individualUserData.last_video_created_on,
        individualUserData.topup_amount,
        individualUserData.last_topup_date,
        basicHelper.convertWeiToNormal(individualUserData.amount_raised),
        basicHelper.convertWeiToNormal(individualUserData.amount_spent),
        individualUserData.no_of_transactions,
        individualUserData.last_transaction_date,
        individualUserData.videos_watched,
        individualUserData.last_video_watched_date
      ];
      dataToUpload.push(row);
    }

    if (oThis.queryStartTimeStampInSeconds && oThis.queryEndTimeStampInSeconds) {
      const timeDifference = oThis.queryEndTimeStampInSeconds - oThis.queryStartTimeStampInSeconds;

      switch (timeDifference) {
        case 7 * 24 * 60 * 60: {
          // 7 days.
          return new GoogleSheetsUploadData().upload(
            pepoUsageSheetNamesConstants.userDataLastSevenDaysSheetName,
            dataToUpload,
            pepoUsageSheetNamesConstants.usageReportNamesToGroupIdsMap[
              pepoUsageSheetNamesConstants.userDataLastSevenDaysSheetName
            ]
          );
        }
        case 24 * 60 * 60: {
          // 24 hours.
          return new GoogleSheetsUploadData().upload(
            pepoUsageSheetNamesConstants.userDataLastTwentyFourHoursSheetName,
            dataToUpload,
            pepoUsageSheetNamesConstants.usageReportNamesToGroupIdsMap[
              pepoUsageSheetNamesConstants.userDataLastTwentyFourHoursSheetName
            ]
          );
        }
        default: {
          throw new Error('Invalid time differences.');
        }
      }
    } else {
      return new GoogleSheetsUploadData().upload(
        pepoUsageSheetNamesConstants.userDataLifetimeSheetName,
        dataToUpload,
        pepoUsageSheetNamesConstants.usageReportNamesToGroupIdsMap[
          pepoUsageSheetNamesConstants.userDataLifetimeSheetName
        ]
      );
    }
  }
}

module.exports = UserData;
