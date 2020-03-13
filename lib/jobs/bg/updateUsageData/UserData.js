const fs = require('fs'),
  csvParser = require('csv-parser');

const rootPrefix = '../../../..',
  UserModel = require(rootPrefix + '/app/models/mysql/User'),
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  GoogleSheetsUploadData = require(rootPrefix + '/lib/google/Sheet'),
  InviteCodeModel = require(rootPrefix + '/app/models/mysql/InviteCode'),
  UserDeviceModel = require(rootPrefix + '/app/models/mysql/UserDevice'),
  VideoDetailModel = require(rootPrefix + '/app/models/mysql/VideoDetail'),
  ReplyDetailModel = require(rootPrefix + '/app/models/mysql/ReplyDetail'),
  TwitterUserModel = require(rootPrefix + '/app/models/mysql/TwitterUser'),
  TransactionModel = require(rootPrefix + '/app/models/mysql/Transaction'),
  InternalUserModel = require(rootPrefix + '/app/models/mysql/InternalUser'),
  UserUtmDetailModel = require(rootPrefix + '/app/models/mysql/UserUtmDetail'),
  FiatPaymentModel = require(rootPrefix + '/app/models/mysql/fiat/FiatPayment'),
  UserMuteByUser2IdsForGlobalCache = require(rootPrefix + '/lib/cacheManagement/multi/UserMuteByUser2IdsForGlobal'),
  basicHelper = require(rootPrefix + '/helpers/basic'),
  s3Wrapper = require(rootPrefix + '/lib/aws/S3Wrapper'),
  coreConstants = require(rootPrefix + '/config/coreConstants'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  inviteCodeConstants = require(rootPrefix + '/lib/globalConstant/inviteCode'),
  replyDetailConstant = require(rootPrefix + '/lib/globalConstant/replyDetail'),
  videoDetailConstant = require(rootPrefix + '/lib/globalConstant/videoDetail'),
  transactionConstants = require(rootPrefix + '/lib/globalConstant/transaction'),
  fiatPaymentConstants = require(rootPrefix + '/lib/globalConstant/fiat/fiatPayment'),
  userUtmDetailsConstants = require(rootPrefix + '/lib/globalConstant/userUtmDetail'),
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
   * @param {string} [params.sheetName]: Google sheet name which needs to be updated.
   * @param {number} [params.sheetGid]: Google sheet gid which needs to be updated.
   *
   * @constructor
   */
  constructor(params) {
    const oThis = this;

    oThis.queryStartTimeStampInSeconds = params.queryStartTimeStampInSeconds || null;
    oThis.queryEndTimeStampInSeconds = params.queryEndTimeStampInSeconds || null;
    oThis.sheetName = params.sheetName;
    oThis.sheetGid = params.sheetGid;

    oThis.finalData = {};
    oThis.internalUserIdsMap = {};
    oThis.videoWatchData = [];
    oThis.replyWatchData = [];
    oThis.deviceIdToVideoDetailsMap = {};
    oThis.deviceIdToReplyDetailsMap = {};
    oThis.userIdToVideoDetailsMap = {};
    oThis.userIdToReplyDetailsMap = {};
  }

  /**
   * Main performer for class.
   *
   * @returns {Promise<void>}
   */
  async perform() {
    const oThis = this;

    await oThis.fetchInternalUsers();

    await oThis.fetchUserDetails();

    await oThis.uploadData();
  }

  /**
   * Fetch internal users.
   *
   * @returns {Promise<void>}
   */
  async fetchInternalUsers() {
    const oThis = this;

    const limit = batchSize;

    let page = 0,
      offset = 0,
      isMoreDataPresent = true;

    while (isMoreDataPresent) {
      const internalUserRows = await new InternalUserModel()
        .select('*')
        .limit(limit)
        .offset(offset)
        .fire();

      if (internalUserRows.length === 0) {
        isMoreDataPresent = false;
      } else {
        for (let index = 0; index < internalUserRows.length; index++) {
          const internalUserRow = internalUserRows[index];
          oThis.internalUserIdsMap[internalUserRow.user_id] = internalUserRow.id;
        }
        page++;
        offset = page * limit;
      }
    }
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

    const bucket = coreConstants.S3_USER_ASSETS_BUCKET,
      videoKey = coreConstants.PA_VIDEO_PIXEL_DATA_S3_FILE_PATH,
      replyKey = coreConstants.PA_REPLY_PIXEL_DATA_S3_FILE_PATH,
      videoCsvPath = coreConstants.PA_VIDEO_PIXEL_DATA_APP_FILE_PATH,
      replyCsvPath = coreConstants.PA_REPLY_PIXEL_DATA_APP_FILE_PATH;

    await s3Wrapper.downloadObjectToDisk(bucket, videoKey, videoCsvPath);
    await s3Wrapper.downloadObjectToDisk(bucket, replyKey, replyCsvPath);

    oThis.videoWatchData = await oThis.parseCsvFile(videoCsvPath);
    oThis.processCsvDataForVideos();

    oThis.replyWatchData = await oThis.parseCsvFile(replyCsvPath);
    oThis.processCsvDataForReplies();

    while (isMoreDataPresent) {
      const batchdata = {};
      const userDbRows = await new UserModel()
        .select('id, created_at, name, user_name, properties, email')
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
            sign_up_date: basicHelper.timeStampInMinutesToDateTillSeconds(userRow.created_at),
            name: userRow.name,
            user_name: userRow.user_name,
            twitter_handle: '',
            utm_campaign: '',
            utm_medium: '',
            utm_source: '',
            email: userRow.email || '',
            is_internal_user: oThis._checkIfInternalUser(userRow),
            is_approved: UserModel.isUserApprovedCreator(userRow),
            is_creator: 0,
            inviter_code_id: '',
            custom_invite_code: '',
            inviter_user_name: '',
            code: '',
            total_videos: 0,
            first_video_created_on: '',
            last_video_created_on: '',
            kind: '',
            amount_raised: 0,
            amount_spent: 0,
            topup_amount: 0,
            last_topup_date: '',
            no_of_transactions: 0,
            last_transaction_date: '',
            videos_somewhat_watched: 0,
            videos_full_watched: 0,
            videos_half_watched: 0,
            replies_somewhat_watched: 0,
            replies_full_watched: 0,
            replies_half_watched: 0,
            last_video_watched_date: '',
            last_reply_watched_date: ''
          };
        }

        page++;
        offset = page * limit;

        await oThis.fetchMuteUserDetails(batchdata);
        await oThis.fetchInviteCodeDetails(batchdata);
        await oThis.fetchUserVideoDetails(batchdata);
        await oThis.fetchUserReplyDetails(batchdata);
        await oThis.fetchTopUpInformation(batchdata);
        await oThis.fetchTwitterDetails(batchdata);
        await oThis.fetchTransactionDetails(batchdata);
        await oThis.fetchVideoStatsDetails(batchdata);
        await oThis.fetchUtmDetails(batchdata);

        Object.assign(oThis.finalData, batchdata);
      }
    }
  }

  /**
   * Check if user is internal user that is staging user or not.
   *
   * @param {object} userDbRow
   *
   * @returns {number}
   * @private
   */
  _checkIfInternalUser(userDbRow) {
    const oThis = this;

    if (oThis.internalUserIdsMap[userDbRow.id]) {
      return 1;
    }

    return 0;
  }

  /**
   * Fetch mute user details.
   *
   * @param {object} batchdata
   *
   * @returns {Promise<*>}
   */
  async fetchMuteUserDetails(batchdata) {
    const userIds = Object.keys(batchdata);

    const cacheResponse = await new UserMuteByUser2IdsForGlobalCache({ user2Ids: userIds }).fetch();
    if (cacheResponse.isFailure()) {
      return Promise.reject(cacheResponse);
    }

    for (let index = 0; index < userIds.length; index++) {
      const userId = userIds[index];

      const isUserUnMuted = cacheResponse.data[userId].all == 0;

      if (batchdata[userId].is_approved && isUserUnMuted) {
        batchdata[userId].is_creator = 1;
      }
    }

    return batchdata;
  }

  /**
   * Fetch invite code details.
   *
   * @param {object} batchdata
   *
   * @returns {Promise<object>}
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
   * @returns {Promise<string>}
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
   * @param {object} batchedData
   *
   * @returns {Promise<object>}
   */
  async fetchUserVideoDetails(batchedData) {
    const oThis = this;

    const userIds = Object.keys(batchedData);

    const whereClauseArray = ['creator_user_id IN (?)', userIds];

    if (oThis.queryStartTimeStampInSeconds && oThis.queryEndTimeStampInSeconds) {
      whereClauseArray[0] += ' AND created_at > (?) AND created_at < (?)';
      whereClauseArray.push(oThis.queryStartTimeStampInSeconds, oThis.queryEndTimeStampInSeconds);
    }

    const videoDetailRows = await new VideoDetailModel()
      .select(
        'creator_user_id, MIN(created_at) AS firstVideoCreation, MAX(created_at) AS lastVideoCreation, COUNT(1) AS total_videos'
      )
      .where(whereClauseArray)
      .where(['status = ?', videoDetailConstant.invertedStatuses[videoDetailConstant.activeStatus]])
      .group_by('creator_user_id')
      .fire();

    for (let index = 0; index < videoDetailRows.length; index++) {
      const videoDetailRow = videoDetailRows[index];

      if (videoDetailRow.creator_user_id) {
        batchedData[videoDetailRow.creator_user_id] = Object.assign(batchedData[videoDetailRow.creator_user_id], {
          total_videos: videoDetailRow.total_videos,
          first_video_created_on: basicHelper.timeStampInMinutesToDateTillSeconds(videoDetailRow.firstVideoCreation),
          last_video_created_on: basicHelper.timeStampInMinutesToDateTillSeconds(videoDetailRow.lastVideoCreation)
        });
      }
    }

    return batchedData;
  }

  /**
   * Fetch user reply details.
   *
   * @param {object} batchedData
   *
   * @returns {Promise<object>}
   */
  async fetchUserReplyDetails(batchedData) {
    const oThis = this;

    const userIds = Object.keys(batchedData);

    const whereClauseArray = ['creator_user_id IN (?)', userIds];

    if (oThis.queryStartTimeStampInSeconds && oThis.queryEndTimeStampInSeconds) {
      whereClauseArray[0] += ' AND created_at > (?) AND created_at < (?)';
      whereClauseArray.push(oThis.queryStartTimeStampInSeconds, oThis.queryEndTimeStampInSeconds);
    }

    const replyDetailRows = await new ReplyDetailModel()
      .select(
        'creator_user_id, MIN(created_at) AS firstReplyCreation, MAX(created_at) AS lastReplyCreation, COUNT(1) AS total_replies'
      )
      .where(whereClauseArray)
      .where(['status = ?', replyDetailConstant.invertedStatuses[replyDetailConstant.activeStatus]])
      .group_by('creator_user_id')
      .fire();

    for (let index = 0; index < replyDetailRows.length; index++) {
      const replyDetailRow = replyDetailRows[index];

      if (replyDetailRow.creator_user_id) {
        batchedData[replyDetailRow.creator_user_id] = Object.assign(batchedData[replyDetailRow.creator_user_id], {
          total_replies: replyDetailRow.total_replies,
          first_reply_created_on: basicHelper.timeStampInMinutesToDateTillSeconds(replyDetailRow.firstReplyCreation),
          last_reply_created_on: basicHelper.timeStampInMinutesToDateTillSeconds(replyDetailRow.lastReplyCreation)
        });
      }
    }

    return batchedData;
  }

  /**
   * Fetch topup information for user.
   *
   * @param {object} batchedData
   *
   * @returns {Promise<object>}
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
      .select('from_user_id, sum(amount) as amount, max(created_at) as last_topup_date')
      .where(whereClauseArray)
      .group_by('from_user_id')
      .fire();

    for (let index = 0; index < fiatPaymentRows.length; index++) {
      const fiatPaymentRow = fiatPaymentRows[index];

      if (fiatPaymentRow.from_user_id) {
        if (fiatPaymentRow.amount) {
          batchedData[fiatPaymentRow.from_user_id].topup_amount = fiatPaymentRow.amount;
        }
        batchedData[fiatPaymentRow.from_user_id].last_topup_date = basicHelper.timeStampInMinutesToDateTillSeconds(
          fiatPaymentRow.last_topup_date
        );
      }
    }

    return batchedData;
  }

  /**
   * Fetch twitter details.
   *
   * @param {object} batchedData
   *
   * @returns {Promise<object>}
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
   * @param {object} batchedData
   *
   * @returns {Promise<object>}
   */
  async fetchTransactionDetails(batchedData) {
    const oThis = this;

    const userIds = Object.keys(batchedData);

    const whereClauseArray = [
      'from_user_id IN (?) AND status = ?',
      userIds,
      transactionConstants.invertedStatuses[transactionConstants.doneStatus]
    ];

    const kindArray = [
      transactionConstants.invertedKinds[transactionConstants.userTransactionKind],
      transactionConstants.invertedKinds[transactionConstants.userTransactionOnReplyKind]
    ];

    if (oThis.queryStartTimeStampInSeconds && oThis.queryEndTimeStampInSeconds) {
      whereClauseArray[0] += ' AND created_at > (?) AND created_at < (?)';
      whereClauseArray.push(oThis.queryStartTimeStampInSeconds, oThis.queryEndTimeStampInSeconds);
    }

    const transactionRows = await new TransactionModel()
      .select(
        'from_user_id, count(*) as transactionCount, max(created_at) as lastTransactionCreation, sum(amount) as totalSpent'
      )
      .where(whereClauseArray)
      .where({ kind: kindArray })
      .group_by(['from_user_id'])
      .fire();

    for (let index = 0; index < transactionRows.length; index++) {
      const transactionRow = transactionRows[index];

      if (transactionRow.from_user_id) {
        batchedData[transactionRow.from_user_id].no_of_transactions = transactionRow.transactionCount;
        batchedData[transactionRow.from_user_id].amount_spent = transactionRow.totalSpent;
        if (transactionRow.lastTransactionCreation) {
          batchedData[
            transactionRow.from_user_id
          ].last_transaction_date = basicHelper.timeStampInMinutesToDateTillSeconds(
            transactionRow.lastTransactionCreation
          );
        }
      }
    }

    const whereClauseArray2 = [
      'to_user_id IN (?) AND status = ?',
      userIds,
      transactionConstants.invertedStatuses[transactionConstants.doneStatus]
    ];

    if (oThis.queryStartTimeStampInSeconds && oThis.queryEndTimeStampInSeconds) {
      whereClauseArray2[0] += ' AND created_at > (?) AND created_at < (?)';
      whereClauseArray2.push(oThis.queryStartTimeStampInSeconds, oThis.queryEndTimeStampInSeconds);
    }

    const transactionRows2 = await new TransactionModel()
      .select('to_user_id, sum(amount) as totalRaised')
      .where(whereClauseArray2)
      .where({ kind: kindArray })
      .group_by(['to_user_id'])
      .fire();

    for (let index = 0; index < transactionRows2.length; index++) {
      const transactionRow = transactionRows2[index];
      batchedData[transactionRow.to_user_id].amount_raised = transactionRow.totalRaised;
    }

    return batchedData;
  }

  /**
   * Process csv data for videos
   * @return {*}
   */
  processCsvDataForVideos() {
    const oThis = this;

    const parsedDataArray = oThis.videoWatchData;

    if (parsedDataArray.length === 0) {
      logger.info('===== Pixel data is empty =====');

      return;
    }

    // Loop over parsed data to create deviceId to video details map.
    for (let index = 0; index < parsedDataArray.length; index++) {
      const parsedDataRow = parsedDataArray[index],
        rowTimestamp = new Date(parsedDataRow.timestamp);

      if (Number(parsedDataRow.u_id) > 0) {
        oThis.userIdToVideoDetailsMap[parsedDataRow.u_id] = oThis.userIdToVideoDetailsMap[parsedDataRow.u_id] || {
          total_videos_somewhat_watched: 0,
          total_videos_full_watched: 0,
          total_videos_half_watched: 0,
          latestTimestamp: rowTimestamp
        };

        if (parsedDataRow.entity_action === 'view') {
          oThis.userIdToVideoDetailsMap[
            parsedDataRow.u_id
          ].total_videos_somewhat_watched += +parsedDataRow.total_videos_watched;
        } else if (parsedDataRow.entity_action === 'full_viewed') {
          oThis.userIdToVideoDetailsMap[
            parsedDataRow.u_id
          ].total_videos_full_watched += +parsedDataRow.total_videos_watched;
        } else if (parsedDataRow.entity_action === 'half_viewed') {
          oThis.userIdToVideoDetailsMap[
            parsedDataRow.u_id
          ].total_videos_half_watched += +parsedDataRow.total_videos_watched;
        }

        if (rowTimestamp > oThis.userIdToVideoDetailsMap[parsedDataRow.u_id].latestTimestamp) {
          oThis.userIdToVideoDetailsMap[parsedDataRow.u_id].latestTimestamp = rowTimestamp;
        }
      } else {
        oThis.deviceIdToVideoDetailsMap[parsedDataRow.device_id] = oThis.deviceIdToVideoDetailsMap[
          parsedDataRow.device_id
        ] || {
          total_videos_somewhat_watched: 0,
          total_videos_full_watched: 0,
          total_videos_half_watched: 0,
          latestTimestamp: rowTimestamp
        };

        if (parsedDataRow.entity_action === 'view') {
          oThis.deviceIdToVideoDetailsMap[
            parsedDataRow.device_id
          ].total_videos_somewhat_watched += +parsedDataRow.total_videos_watched;
        } else if (parsedDataRow.entity_action === 'full_viewed') {
          oThis.deviceIdToVideoDetailsMap[
            parsedDataRow.device_id
          ].total_videos_full_watched += +parsedDataRow.total_videos_watched;
        } else if (parsedDataRow.entity_action === 'half_viewed') {
          oThis.deviceIdToVideoDetailsMap[
            parsedDataRow.device_id
          ].total_videos_half_watched += +parsedDataRow.total_videos_watched;
        }

        if (rowTimestamp > oThis.deviceIdToVideoDetailsMap[parsedDataRow.device_id].latestTimestamp) {
          oThis.deviceIdToVideoDetailsMap[parsedDataRow.device_id].latestTimestamp = rowTimestamp;
        }
      }
    }
  }

  /**
   * Process csv data for replies
   * @return {*}
   */
  processCsvDataForReplies() {
    const oThis = this;

    const parsedDataArray = oThis.replyWatchData;

    if (parsedDataArray.length === 0) {
      logger.info('===== Pixel data is empty =====');

      return;
    }

    // Loop over parsed data to create deviceId to reply details map.
    for (let index = 0; index < parsedDataArray.length; index++) {
      const parsedDataRow = parsedDataArray[index],
        rowTimestamp = new Date(parsedDataRow.timestamp);

      if (Number(parsedDataRow.u_id) > 0) {
        oThis.userIdToReplyDetailsMap[parsedDataRow.u_id] = oThis.userIdToReplyDetailsMap[parsedDataRow.u_id] || {
          total_replies_somewhat_watched: 0,
          total_replies_full_watched: 0,
          total_replies_half_watched: 0,
          latestTimestamp: rowTimestamp
        };

        if (parsedDataRow.entity_action === 'view') {
          oThis.userIdToReplyDetailsMap[
            parsedDataRow.u_id
          ].total_replies_somewhat_watched += +parsedDataRow.total_replies_watched;
        } else if (parsedDataRow.entity_action === 'full_viewed') {
          oThis.userIdToReplyDetailsMap[
            parsedDataRow.u_id
          ].total_replies_full_watched += +parsedDataRow.total_replies_watched;
        } else if (parsedDataRow.entity_action === 'half_viewed') {
          oThis.userIdToReplyDetailsMap[
            parsedDataRow.u_id
          ].total_replies_half_watched += +parsedDataRow.total_replies_watched;
        }

        if (rowTimestamp > oThis.userIdToReplyDetailsMap[parsedDataRow.u_id].latestTimestamp) {
          oThis.userIdToReplyDetailsMap[parsedDataRow.u_id].latestTimestamp = rowTimestamp;
        }
      } else {
        oThis.deviceIdToReplyDetailsMap[parsedDataRow.device_id] = oThis.deviceIdToReplyDetailsMap[
          parsedDataRow.device_id
        ] || {
          total_replies_somewhat_watched: 0,
          total_replies_full_watched: 0,
          total_replies_half_watched: 0,
          latestTimestamp: rowTimestamp
        };

        if (parsedDataRow.entity_action === 'view') {
          oThis.deviceIdToReplyDetailsMap[
            parsedDataRow.device_id
          ].total_replies_somewhat_watched += +parsedDataRow.total_replies_watched;
        } else if (parsedDataRow.entity_action === 'full_viewed') {
          oThis.deviceIdToReplyDetailsMap[
            parsedDataRow.device_id
          ].total_replies_full_watched += +parsedDataRow.total_replies_watched;
        } else if (parsedDataRow.entity_action === 'half_viewed') {
          oThis.deviceIdToReplyDetailsMap[
            parsedDataRow.device_id
          ].total_replies_half_watched += +parsedDataRow.total_replies_watched;
        }

        if (rowTimestamp > oThis.deviceIdToReplyDetailsMap[parsedDataRow.device_id].latestTimestamp) {
          oThis.deviceIdToReplyDetailsMap[parsedDataRow.device_id].latestTimestamp = rowTimestamp;
        }
      }
    }
  }

  /**
   * Fetch videos watched details.
   *
   * @param {object} batchedData
   *
   * @returns {Promise<object>}
   */
  async fetchVideoStatsDetails(batchedData) {
    const oThis = this;

    if (oThis.videoWatchData.length === 0 && oThis.replyWatchData.length === 0) {
      logger.info('===== Pixel data is empty =====');

      return batchedData;
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

      let totalVideosVisited = oThis.userIdToVideoDetailsMap[userId]
          ? oThis.userIdToVideoDetailsMap[userId].total_videos_somewhat_watched
          : 0,
        totalVideosFullWatched = oThis.userIdToVideoDetailsMap[userId]
          ? oThis.userIdToVideoDetailsMap[userId].total_videos_full_watched
          : 0,
        totalVideosHalfWatched = oThis.userIdToVideoDetailsMap[userId]
          ? oThis.userIdToVideoDetailsMap[userId].total_videos_half_watched
          : 0,
        totalRepliesVisited = oThis.userIdToReplyDetailsMap[userId]
          ? oThis.userIdToReplyDetailsMap[userId].total_replies_somewhat_watched
          : 0,
        totalRepliesFullWatched = oThis.userIdToReplyDetailsMap[userId]
          ? oThis.userIdToReplyDetailsMap[userId].total_replies_full_watched
          : 0,
        totalRepliesHalfWatched = oThis.userIdToReplyDetailsMap[userId]
          ? oThis.userIdToReplyDetailsMap[userId].total_replies_half_watched
          : 0,
        latestVideoTimestamp = oThis.userIdToVideoDetailsMap[userId]
          ? oThis.userIdToVideoDetailsMap[userId].latestTimestamp
          : new Date(0),
        latestReplyTimestamp = oThis.userIdToReplyDetailsMap[userId]
          ? oThis.userIdToReplyDetailsMap[userId].latestTimestamp
          : new Date(0);

      for (let index = 0; index < deviceIds.length; index++) {
        const deviceId = deviceIds[index];

        // There is a possibility that the deviceId obtained from the DB does not exist in the CSV.
        if (CommonValidators.validateNonEmptyObject(oThis.deviceIdToVideoDetailsMap[deviceId])) {
          totalVideosVisited += oThis.deviceIdToVideoDetailsMap[deviceId].total_videos_somewhat_watched;
          totalVideosFullWatched += oThis.deviceIdToVideoDetailsMap[deviceId].total_videos_full_watched;
          totalVideosHalfWatched += oThis.deviceIdToVideoDetailsMap[deviceId].total_videos_half_watched;

          if (oThis.deviceIdToVideoDetailsMap[deviceId].latestTimestamp > latestVideoTimestamp) {
            latestVideoTimestamp = oThis.deviceIdToVideoDetailsMap[deviceId].latestTimestamp;
          }
        }

        // There is a possibility that the deviceId obtained from the DB does not exist in the CSV.
        if (CommonValidators.validateNonEmptyObject(oThis.deviceIdToReplyDetailsMap[deviceId])) {
          totalRepliesVisited += oThis.deviceIdToReplyDetailsMap[deviceId].total_replies_somewhat_watched;
          totalRepliesFullWatched += oThis.deviceIdToReplyDetailsMap[deviceId].total_replies_full_watched;
          totalRepliesHalfWatched += oThis.deviceIdToReplyDetailsMap[deviceId].total_replies_half_watched;

          if (oThis.deviceIdToReplyDetailsMap[deviceId].latestTimestamp > latestReplyTimestamp) {
            latestReplyTimestamp = oThis.deviceIdToReplyDetailsMap[deviceId].latestTimestamp;
          }
        }
      }

      batchedData[userId].videos_somewhat_watched = totalVideosVisited;
      batchedData[userId].videos_full_watched = totalVideosFullWatched;
      batchedData[userId].videos_half_watched = totalVideosHalfWatched;
      batchedData[userId].replies_somewhat_watched = totalRepliesVisited;
      batchedData[userId].replies_full_watched = totalRepliesFullWatched;
      batchedData[userId].replies_half_watched = totalRepliesHalfWatched;

      if (latestVideoTimestamp.toTimeString() !== new Date(0).toTimeString()) {
        latestVideoTimestamp = Math.floor(latestVideoTimestamp.getTime() / 1000);
        batchedData[userId].last_video_watched_date = basicHelper.timeStampInMinutesToDateTillSeconds(
          latestVideoTimestamp
        );
      }

      if (latestReplyTimestamp.toTimeString() !== new Date(0).toTimeString()) {
        latestReplyTimestamp = Math.floor(latestReplyTimestamp.getTime() / 1000);
        batchedData[userId].last_reply_watched_date = basicHelper.timeStampInMinutesToDateTillSeconds(
          latestReplyTimestamp
        );
      }
    }

    return batchedData;
  }

  /**
   * Fetch Utm details for user.
   *
   * @param {object} batchedData
   *
   * @returns {Promise<object>}
   */
  async fetchUtmDetails(batchedData) {
    const userIds = Object.keys(batchedData);

    const whereClauseArray = [
      'user_id IN (?) AND kind = ?',
      userIds,
      userUtmDetailsConstants.invertedKinds[userUtmDetailsConstants.signUpKind]
    ];

    const userUtmRows = await new UserUtmDetailModel()
      .select('user_id, utm_campaign, utm_medium, utm_source')
      .where(whereClauseArray)
      .fire();

    for (let index = 0; index < userUtmRows.length; index++) {
      const userUtmRow = userUtmRows[index];
      batchedData[userUtmRow.user_id] = Object.assign(batchedData[userUtmRow.user_id], {
        utm_campaign: userUtmRow.utm_campaign,
        utm_medium: userUtmRow.utm_medium,
        utm_source: userUtmRow.utm_source
      });
    }

    return batchedData;
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

    let queryStartTimeDateObject, queryEndTimeDateObject;
    if (oThis.queryStartTimeStampInSeconds && oThis.queryEndTimeStampInSeconds) {
      queryStartTimeDateObject = new Date(oThis.queryStartTimeStampInSeconds * 1000);
      queryEndTimeDateObject = new Date(oThis.queryEndTimeStampInSeconds * 1000);
    }

    return new Promise(function(onResolve) {
      try {
        // eslint-disable-next-line no-sync
        if (fs.existsSync(csvFilePath)) {
          fs.createReadStream(csvFilePath)
            .pipe(csvParser())
            .on('data', function(row) {
              if (oThis.queryStartTimeStampInSeconds && oThis.queryEndTimeStampInSeconds) {
                const parsedRowDateObject = new Date(row.date);
                if (parsedRowDateObject > queryStartTimeDateObject && parsedRowDateObject < queryEndTimeDateObject) {
                  csvDataArray.push(row);
                } else {
                  // Do nothing. No need to include this row.
                }
              } else {
                csvDataArray.push(row);
              }
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

    const dataToUpload = [];
    dataToUpload.push(oThis.rowKeys);

    for (const userId in oThis.finalData) {
      const individualUserData = oThis.finalData[userId];

      const row = [
        userId,
        individualUserData.sign_up_date,
        individualUserData.name,
        individualUserData.email,
        individualUserData.is_internal_user,
        individualUserData.twitter_handle,
        individualUserData.utm_campaign,
        individualUserData.utm_medium,
        individualUserData.utm_source,
        individualUserData.is_creator,
        individualUserData.inviter_user_name,
        individualUserData.custom_invite_code,
        individualUserData.total_videos,
        individualUserData.first_video_created_on,
        individualUserData.last_video_created_on,
        individualUserData.total_replies,
        individualUserData.first_reply_created_on,
        individualUserData.last_reply_created_on,
        individualUserData.topup_amount,
        individualUserData.last_topup_date,
        basicHelper.convertWeiToNormal(individualUserData.amount_raised),
        basicHelper.convertWeiToNormal(individualUserData.amount_spent),
        individualUserData.no_of_transactions,
        individualUserData.last_transaction_date,
        individualUserData.videos_somewhat_watched,
        individualUserData.videos_half_watched,
        individualUserData.videos_full_watched,
        individualUserData.replies_somewhat_watched,
        individualUserData.replies_half_watched,
        individualUserData.replies_full_watched,
        individualUserData.last_video_watched_date,
        individualUserData.last_reply_watched_date
      ];
      dataToUpload.push(row);
    }

    if (oThis.sheetName && oThis.sheetGid) {
      return new GoogleSheetsUploadData().upload(oThis.sheetName, dataToUpload, oThis.sheetGid);
    } else if (oThis.queryStartTimeStampInSeconds && oThis.queryEndTimeStampInSeconds) {
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

  /**
   * Returns row keys.
   *
   * @returns {*[]}
   */
  get rowKeys() {
    return [
      'user_id',
      'sign_up_date',
      'name',
      'email',
      'is_internal_user',
      'twitter_handle',
      'utm_campaign',
      'utm_medium',
      'utm_source',
      'is_creator',
      'inviter_user_name',
      'custom_invite_code',
      'total_videos',
      'first_video_created_on',
      'last_video_created_on',
      'total_replies',
      'first_reply_created_on',
      'last_reply_created_on',
      'topup_amount',
      'last_topup_date',
      'amount_raised',
      'amount_spent',
      'no_of_transactions',
      'last_transaction_date',
      'videos_somewhat_watched',
      'videos_half_watched',
      'videos_full_watched',
      'replies_somewhat_watched',
      'replies_half_watched',
      'replies_full_watched',
      'last_video_watched_date',
      'last_reply_watched_date'
    ];
  }
}

module.exports = UserData;
