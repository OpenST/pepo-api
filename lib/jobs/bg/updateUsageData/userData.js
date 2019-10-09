const rootPrefix = '../../../..',
  UserModel = require(rootPrefix + '/app/models/mysql/User'),
  UserStatModel = require(rootPrefix + '/app/models/mysql/UserStat'),
  InviteCodeModel = require(rootPrefix + '/app/models/mysql/InviteCode'),
  VideoDetailModel = require(rootPrefix + '/app/models/mysql/VideoDetail'),
  FiatPaymentModel = require(rootPrefix + '/app/models/mysql/FiatPayment'),
  TwitterUserModel = require(rootPrefix + '/app/models/mysql/TwitterUser'),
  basicHelper = require(rootPrefix + '/helpers/basic'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  inviteCodeConstants = require(rootPrefix + '/lib/globalConstant/inviteCode'),
  fiatPaymentConstants = require(rootPrefix + '/lib/globalConstant/fiatPayment');

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
   * @constructor
   */
  constructor() {
    const oThis = this;

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

    oThis.printFinalResponse();
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
            last_topup_date: ''
          };
        }

        page++;
        offset = page * limit;
        const batchedDataWithInviteCode = await oThis.fetchInviteCodeDetails(batchdata),
          batchedDataWithUserVideoDetail = await oThis.fetchUserVideoDetails(batchedDataWithInviteCode),
          batchedDataWithUserStats = await oThis.fetchUserStats(batchedDataWithUserVideoDetail),
          batchedDataWithTopupInfo = await oThis.fetchTopUpInformation(batchedDataWithUserStats),
          batchedDataWithTwitterDetails = await oThis.fetchTwitterDetails(batchedDataWithTopupInfo);

        Object.assign(oThis.finalData, batchedDataWithTwitterDetails);
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
   * Fetch user video details.
   *
   * @param {array<number>} batchdata
   *
   * @returns {Promise<array<number>>}
   */
  async fetchUserVideoDetails(batchdata) {
    const userIds = Object.keys(batchdata);

    const videoDetailRows = await new VideoDetailModel()
      .select(
        'creator_user_id, created_at, MIN(created_at) AS firstVideoCreation, MAX(created_at) AS lastVideoCreation, COUNT(1) AS count'
      )
      .where(['creator_user_id IN (?)', userIds])
      .group_by('creator_user_id')
      .order_by('created_at ASC')
      .fire();

    for (let index = 0; index < videoDetailRows.length; index++) {
      const videoDetailRow = videoDetailRows[index];

      batchdata[videoDetailRow.creator_user_id] = Object.assign(batchdata[videoDetailRow.creator_user_id], {
        count: videoDetailRow.count,
        first_video_created_on: basicHelper.timeStampInMinutesToDateTillSeconds(videoDetailRow.firstVideoCreation),
        last_video_created_on: basicHelper.timeStampInMinutesToDateTillSeconds(videoDetailRow.lastVideoCreation)
      });
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
    const userIds = Object.keys(batchedData);

    const userStatRows = await new UserStatModel()
      .select('user_id, total_amount_raised, total_amount_spent')
      .where(['user_id IN (?)', userIds])
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
    const userIds = Object.keys(batchedData);

    const fiatPaymentRows = await new FiatPaymentModel()
      .select('from_user_id, sum(amount) as amount, created_at')
      .where([
        'status = ? AND kind = ? AND from_user_id IN (?)',
        fiatPaymentConstants.invertedStatuses[fiatPaymentConstants.pepoTransferSuccessStatus],
        fiatPaymentConstants.invertedKinds[fiatPaymentConstants.topUpKind],
        userIds
      ])
      .group_by('from_user_id')
      .order_by('created_at DESC')
      .fire();

    for (let index = 0; index < fiatPaymentRows.length; index++) {
      const fiatPaymentRow = fiatPaymentRows[index];

      batchedData[fiatPaymentRow.from_user_id].topup_amount = fiatPaymentRow.amount;
      batchedData[fiatPaymentRow.from_user_id].last_topup_date = basicHelper.timeStampInMinutesToDate(
        fiatPaymentRow.created_at
      );
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
   * Print final response.
   */
  printFinalResponse() {
    const oThis = this;

    console.log(
      'user_id, sign_up_date, name, email, twitter_handle, is_creator, inviter_user_name, custom_invite_code, total_videos, first_video_created_on, last_video_created_on, topup_amount, last_topup_date, amount_raised, amount_spent'
    );

    for (const userId in oThis.finalData) {
      const individualUserData = oThis.finalData[userId];

      console.log(
        `${userId}, ${individualUserData.sign_up_date}, ${individualUserData.name}, ${individualUserData.email}, ${
          individualUserData.twitter_handle
        }, ${individualUserData.is_creator}, ${individualUserData.inviter_user_name}, ${
          individualUserData.custom_invite_code
        }, ${individualUserData.count}, ${individualUserData.first_video_created_on}, ${
          individualUserData.last_video_created_on
        }, ${individualUserData.topup_amount}, ${individualUserData.last_topup_date}, ${basicHelper.convertWeiToNormal(
          individualUserData.amount_raised
        )}, ${basicHelper.convertWeiToNormal(individualUserData.amount_spent)}`
      );
    }
  }
}

module.exports = new UserData();

new UserData()
  .perform()
  .then(function() {
    logger.log('-----Script Finished---- !!!');
    process.exit(0);
  })
  .catch(function(err) {
    logger.log('Error ->', err);
  });
