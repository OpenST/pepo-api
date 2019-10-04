const rootPrefix = '.',
  UserModel = require(rootPrefix + '/app/models/mysql/User'),
  UserStatModel = require(rootPrefix + '/app/models/mysql/UserStat'),
  InviteCodeModel = require(rootPrefix + '/app/models/mysql/InviteCode'),
  VideoDetailModel = require(rootPrefix + '/app/models/mysql/VideoDetail'),
  FiatPaymentModel = require(rootPrefix + '/app/models/mysql/FiatPayment'),
  basicHelper = require(rootPrefix + '/helpers/basic'),
  inviteCodeConstants = require(rootPrefix + '/lib/globalConstant/inviteCode'),
  fiatPaymentConstants = require(rootPrefix + '/lib/globalConstant/fiatPayment');

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

    oThis.userIds = [];
    oThis.userIdToUserDetailsMap = {};
    oThis.inviterCodeIds = [];
  }

  async perform() {
    const oThis = this;

    await oThis.fetchUserDetails();

    const promisesArray = [
      oThis.fetchInviteCodeDetails(),
      oThis.fetchUserVideoDetails(),
      oThis.fetchUserStats(),
      oThis.fetchTopUpInformation()
    ];
    await Promise.all(promisesArray);
  }

  /**
   * Fetch all users data.
   *
   * @sets oThis.userIds, oThis.userIdToUserDetailsMap
   *
   * @returns {Promise<void>}
   */
  async fetchUserDetails() {
    const oThis = this;

    const userDbRows = await new UserModel()
      .select('id, created_at, name, user_name, email')
      .limit(50)
      .fire();

    for (let index = 0; index < userDbRows.length; index++) {
      const userRow = userDbRows[index];

      oThis.userIds.push(userRow.id);
      oThis.userIdToUserDetailsMap[userRow.id] = {
        user_id: userRow.id,
        sign_up_date: basicHelper.timeStampInMinutesToDate(userRow.created_at),
        name: userRow.name,
        user_name: userRow.user_name,
        email: userRow.email || ''
      };
    }
  }

  /**
   * Fetch invite code details.
   *
   * @sets oThis.userIdToUserDetailsMap, oThis.inviterCodeIds
   *
   * @returns {Promise<void>}
   */
  async fetchInviteCodeDetails() {
    const oThis = this;

    const inviterCodeIds = [];

    // Fetch invite code details by userId.
    const inviteCodeByUserIdsRows = await new InviteCodeModel()
      .select('user_id, invite_limit, inviter_code_id')
      .where(['user_id IN (?)', oThis.userIds])
      .fire();

    const userIdToInviteCodeDetails = {};

    for (let index = 0; index < inviteCodeByUserIdsRows.length; index++) {
      const inviteCodeRow = inviteCodeByUserIdsRows[index];

      userIdToInviteCodeDetails[inviteCodeRow.user_id] = {
        is_creator: inviteCodeRow.invite_limit <= 0,
        inviter_code_id: inviteCodeRow.inviter_code_id
      };

      if (inviteCodeRow.inviter_code_id) {
        inviterCodeIds.push(inviteCodeRow.inviter_code_id);
      }
    }

    if (inviterCodeIds.length === 0) {
      for (const userId in oThis.userIdToUserDetailsMap) {
        oThis.userIdToUserDetailsMap[userId].custom_invite_code = '';
        oThis.userIdToUserDetailsMap[userId].inviter_user_name = '';
        oThis.userIdToUserDetailsMap[userId].is_creator = userIdToInviteCodeDetails[userId].is_creator;
      }
    } else {
      // Fetch invite code details by invite code table ids.
      const inviteCodeByIdsRows = await new InviteCodeModel()
        .select('id, code, user_id, kind')
        .where(['id IN (?)', inviterCodeIds])
        .fire();

      const inviteCodeIdToDetailsMap = {};
      for (let index = 0; index < inviteCodeByIdsRows.length; index++) {
        const inviteCodeRow = inviteCodeByIdsRows[index];
        inviteCodeIdToDetailsMap[inviteCodeRow.id] = {
          code: inviteCodeRow.code,
          userId: inviteCodeRow.user_id,
          kind: inviteCodeConstants.kinds[inviteCodeRow.kind]
        };
      }

      // Populate data in map.
      for (const userId in oThis.userIdToUserDetailsMap) {
        const inviteCodeId = userIdToInviteCodeDetails[userId].inviter_code_id;

        oThis.userIdToUserDetailsMap[userId].custom_invite_code = '';
        oThis.userIdToUserDetailsMap[userId].inviter_user_name = '';

        if (inviteCodeId) {
          // Custom invite code is nonUserKind code.
          oThis.userIdToUserDetailsMap[userId].custom_invite_code =
            inviteCodeIdToDetailsMap[inviteCodeId].kind === inviteCodeConstants.nonUserKind
              ? inviteCodeIdToDetailsMap[inviteCodeId].code
              : '';

          const inviterUserId = inviteCodeIdToDetailsMap[inviteCodeId].userId;

          oThis.userIdToUserDetailsMap[userId].inviter_user_name =
            oThis.userIdToUserDetailsMap[inviterUserId].user_name;
        }
      }
    }
  }

  /**
   * Fetch user video details.
   *
   * @sets oThis.userIdToUserDetailsMap
   *
   * @returns {Promise<void>}
   */
  async fetchUserVideoDetails() {
    const oThis = this;

    const videoDetailRows = await new VideoDetailModel()
      .select('creator_user_id, created_at')
      .where(['creator_user_id IN (?)', oThis.userIds])
      .order_by('created_at ASC')
      .fire();

    const creatorUserIdToVideoDetails = {};
    for (let index = 0; index < videoDetailRows.length; index++) {
      const videoDetailRow = videoDetailRows[index];

      creatorUserIdToVideoDetails[videoDetailRow.creator_user_id] = creatorUserIdToVideoDetails[
        videoDetailRow.creator_user_id
      ] || {
        count: 0,
        first_video_created_on: basicHelper.timeStampInMinutesToDateTillSeconds(videoDetailRow.created_at),
        last_video_created_on: basicHelper.timeStampInMinutesToDateTillSeconds(videoDetailRow.created_at)
      };

      creatorUserIdToVideoDetails[videoDetailRow.creator_user_id].count++;
      creatorUserIdToVideoDetails[
        videoDetailRow.creator_user_id
      ].last_video_created_on = basicHelper.timeStampInMinutesToDateTillSeconds(videoDetailRow.created_at);
    }

    for (const userId in oThis.userIdToUserDetailsMap) {
      oThis.userIdToUserDetailsMap[userId].total_videos = creatorUserIdToVideoDetails[userId]
        ? creatorUserIdToVideoDetails[userId].count
        : 0;
      oThis.userIdToUserDetailsMap[userId].first_video_created_on = creatorUserIdToVideoDetails[userId]
        ? creatorUserIdToVideoDetails[userId].first_video_created_on
        : '';
      oThis.userIdToUserDetailsMap[userId].last_video_created_on = creatorUserIdToVideoDetails[userId]
        ? creatorUserIdToVideoDetails[userId].last_video_created_on
        : '';
    }
  }

  /**
   * Fetch user stats.
   *
   * @sets oThis.userIdToUserDetailsMap
   *
   * @returns {Promise<void>}
   */
  async fetchUserStats() {
    const oThis = this;

    const userStatRows = await new UserStatModel()
      .select('user_id, total_amount_raised, total_amount_spent')
      .where(['user_id IN (?)', oThis.userIds])
      .fire();

    const userIdToUserStatsMap = {};
    for (let index = 0; index < userStatRows.length; index++) {
      const userStatRow = userStatRows[index];

      userIdToUserStatsMap[userStatRow.user_id] = {
        amount_raised: userStatRow.total_amount_raised,
        amount_spent: userStatRow.total_amount_spent
      };
    }

    for (const userId in oThis.userIdToUserDetailsMap) {
      oThis.userIdToUserDetailsMap[userId].amount_raised = userIdToUserStatsMap[userId]
        ? userIdToUserStatsMap[userId].amount_raised
        : 0;
      oThis.userIdToUserDetailsMap[userId].amount_spent = userIdToUserStatsMap[userId]
        ? userIdToUserStatsMap[userId].amount_spent
        : 0;
    }
  }

  /**
   * Fetch topup information for user.
   *
   * @sets oThis.userIdToUserDetailsMap
   *
   * @returns {Promise<void>}
   */
  async fetchTopUpInformation() {
    const oThis = this;

    const fiatPaymentRows = await new FiatPaymentModel()
      .select('from_user_id, amount, created_at')
      .where({
        status: fiatPaymentConstants.invertedStatuses[fiatPaymentConstants.pepoTransferSuccessStatus],
        kind: fiatPaymentConstants.invertedKinds[fiatPaymentConstants.topUpKind]
      })
      .order_by('created_at DESC')
      .fire();

    const userIdToFiatPaymentDetails = {};
    for (let index = 0; index < fiatPaymentRows.length; index++) {
      const fiatPaymentRow = fiatPaymentRows[index];

      userIdToFiatPaymentDetails[fiatPaymentRow.from_user_id] = userIdToFiatPaymentDetails[
        fiatPaymentRow.from_user_id
      ] || {
        topup_amount: fiatPaymentRow.amount,
        last_topup_date: basicHelper.timeStampInMinutesToDate(fiatPaymentRow.created_at)
      };

      userIdToFiatPaymentDetails[fiatPaymentRow.from_user_id].topup_amount += fiatPaymentRow.amount;
    }

    for (const userId in oThis.userIdToUserDetailsMap) {
      oThis.userIdToUserDetailsMap[userId].topup_amount = userIdToFiatPaymentDetails[userId]
        ? userIdToFiatPaymentDetails[userId].topup_amount
        : 0;
      oThis.userIdToUserDetailsMap[userId].last_topup_date = userIdToFiatPaymentDetails[userId]
        ? userIdToFiatPaymentDetails[userId].last_topup_date
        : '';
    }
  }
}

module.exports = new UserData();
