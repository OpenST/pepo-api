const rootPrefix = '../../..',
  UserModel = require(rootPrefix + '/app/models/mysql/User'),
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  UserStatModel = require(rootPrefix + '/app/models/mysql/UserStat'),
  InviteCodeModel = require(rootPrefix + '/app/models/mysql/InviteCode'),
  TwitterUserModel = require(rootPrefix + '/app/models/mysql/TwitterUser'),
  VideoDetailModel = require(rootPrefix + '/app/models/mysql/VideoDetail'),
  basicHelper = require(rootPrefix + '/helpers/basic'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

/**
 * Class to fetch signup details by invite code.
 *
 * @class SignupsUsingInviteCode
 */
class SignupsUsingInviteCode {
  /**
   * Constructor to fetch signup details by invite code.
   *
   * @param {object} params
   * @param {array} params.inviteCodes
   *
   * @constructor
   */
  constructor(params) {
    const oThis = this;

    oThis.inviteCodes = params.inviteCodes;

    oThis.inviteCodeResponse = null;
    oThis.inviteCodeMap = {};
    oThis.userIdToInviteCodeMap = {};
    oThis.userIdToUserDetailsMap = {};
    oThis.userIdToTwitterDetailsMap = {};
    oThis.userToVideoDetailsMap = {};
    oThis.userIdToUserStats = {};
    oThis.userIdToFinalMap = {};
  }

  /**
   * Main performer for class.
   *
   * @returns {Promise<*>}
   */
  async perform() {
    const oThis = this;

    if (oThis.inviteCodes.length === 0) {
      return Promise.reject(new Error('Empty invite codes.'));
    }

    return oThis.asyncPerform();
  }

  /**
   * Async perform.
   *
   * @sets oThis.inviteCodeMap
   *
   * @returns {Promise<*>}
   */
  async asyncPerform() {
    const oThis = this;

    await oThis.fetchInviteCodeDetails();

    await oThis.fetchUserDetails();

    const promisesArray = [oThis.fetchTwitterDetails(), oThis.fetchUserVideoDetails(), oThis.fetchUserStats()];
    await Promise.all(promisesArray);

    oThis.finalResponse();
    oThis.printResponse();

    return responseHelper.successWithData({});
  }

  /**
   * Fetch invite code details.
   *
   * @sets oThis.inviteCodeMap, oThis.userIdToInviteCodeMap
   *
   * @returns {Promise<*>}
   */
  async fetchInviteCodeDetails() {
    const oThis = this;

    // Fetch invite code details.
    const queryResponse = await new InviteCodeModel()
      .select('id, code')
      .where(['code IN (?)', oThis.inviteCodes])
      .fire();

    for (let index = 0; index < queryResponse.length; index++) {
      const row = queryResponse[index];
      oThis.inviteCodeMap[row.id] = row.code;
    }

    if (!CommonValidators.validateNonEmptyObject(oThis.inviteCodeMap)) {
      return Promise.reject(new Error('Invalid invite codes.'));
    }

    // Fetch user details for invite codes.
    oThis.inviteCodeResponse = await new InviteCodeModel()
      .select('inviter_code_id, user_id')
      .where(['inviter_code_id IN (?)', Object.keys(oThis.inviteCodeMap)])
      .fire();

    for (let index = 0; index < oThis.inviteCodeResponse.length; index++) {
      const row = oThis.inviteCodeResponse[index];
      oThis.userIdToInviteCodeMap[row.user_id] = oThis.inviteCodeMap[row.inviter_code_id];
    }
  }

  /**
   * Fetch user details.
   *
   * @sets oThis.userIdToUserDetailsMap
   *
   * @returns {Promise<void>}
   */
  async fetchUserDetails() {
    const oThis = this;

    if (!CommonValidators.validateNonEmptyObject(oThis.userIdToInviteCodeMap)) {
      return Promise.reject(new Error('No users found for the invite code.'));
    }

    const userModelResponse = await new UserModel()
      .select('*')
      .where(['id IN (?)', Object.keys(oThis.userIdToInviteCodeMap)])
      .fire();

    for (let index = 0; index < userModelResponse.length; index++) {
      const row = userModelResponse[index];

      oThis.userIdToUserDetailsMap[row.id] = {
        email: row.email,
        userName: row.user_name,
        createdAt: row.created_at,
        isApproved: (row.properties & 4) > 0
      };
    }
  }

  /**
   * Fetch twitter user details.
   *
   * @sets oThis.userIdToTwitterDetailsMap
   *
   * @returns {Promise<void>}
   */
  async fetchTwitterDetails() {
    const oThis = this;

    if (!CommonValidators.validateNonEmptyObject(oThis.userIdToUserDetailsMap)) {
      return Promise.reject(new Error('No users found for the invite code.'));
    }

    const twitterDetailsResponse = await new TwitterUserModel()
      .select('handle, user_id')
      .where(['user_id IN (?)', Object.keys(oThis.userIdToUserDetailsMap)])
      .fire();

    for (let index = 0; index < twitterDetailsResponse.length; index++) {
      oThis.userIdToTwitterDetailsMap[twitterDetailsResponse[index].user_id] = twitterDetailsResponse[index].handle;
    }
  }

  /**
   * Fetch user video details.
   *
   * @sets oThis.userToVideoDetailsMap
   *
   * @returns {Promise<void>}
   */
  async fetchUserVideoDetails() {
    const oThis = this;

    if (!CommonValidators.validateNonEmptyObject(oThis.userIdToUserDetailsMap)) {
      return Promise.reject(new Error('No users found for the invite code.'));
    }

    const videoDetailsResponse = await new VideoDetailModel()
      .select('count (*) as total_videos, creator_user_id')
      .where(['creator_user_id IN (?)', Object.keys(oThis.userIdToUserDetailsMap)])
      .group_by(['creator_user_id'])
      .fire();

    for (let index = 0; index < videoDetailsResponse.length; index++) {
      oThis.userToVideoDetailsMap[videoDetailsResponse[index].creator_user_id] =
        videoDetailsResponse[index].total_videos;
    }
  }

  /**
   * Fetch user stats.
   *
   * @sets oThis.userIdToUserStats
   *
   * @returns {Promise<void>}
   */
  async fetchUserStats() {
    const oThis = this;

    if (!CommonValidators.validateNonEmptyObject(oThis.userIdToUserDetailsMap)) {
      return Promise.reject(new Error('No users found for the invite code.'));
    }

    const userStatResponse = await new UserStatModel()
      .select('total_amount_spent, user_id')
      .where(['user_id IN (?)', Object.keys(oThis.userIdToUserDetailsMap)])
      .fire();

    for (let index = 0; index < userStatResponse.length; index++) {
      oThis.userIdToUserStats[userStatResponse[index].user_id] = userStatResponse[index].total_amount_spent;
    }
  }

  /**
   * Get final response.
   *
   * @sets oThis.userIdToFinalMap
   */
  finalResponse() {
    const oThis = this;

    for (let index = 0; index < oThis.inviteCodeResponse.length; index++) {
      const row = oThis.inviteCodeResponse[index];
      const userId = row.user_id;
      oThis.userIdToFinalMap[userId] = {
        inviteCode: oThis.userIdToInviteCodeMap[userId],
        userName: oThis.userIdToUserDetailsMap[userId].userName,
        email: oThis.userIdToUserDetailsMap[userId].email || '',
        twitterHandle: oThis.userIdToTwitterDetailsMap[userId],
        isApproved: oThis.userIdToUserDetailsMap[userId].isApproved,
        signupDate: basicHelper.timeStampInMinutesToDate(oThis.userIdToUserDetailsMap[userId].createdAt),
        videoCount: oThis.userToVideoDetailsMap[userId] || 0,
        totalPepoSpent: oThis.userIdToUserStats[userId] || 0
      };
    }
  }

  /**
   * Print final response.
   */
  printResponse() {
    const oThis = this;

    logger.log('userName, email, twitterHandle, inviteCodeUsed, isApprovedCreator, signUpDate, videoCount, pepoSpent');

    for (const userId in oThis.userIdToFinalMap) {
      const totalPepoSpent = Number(oThis.userIdToFinalMap[userId].totalPepoSpent) / Number(1000000000000000000);
      logger.log(
        `${oThis.userIdToFinalMap[userId].userName}, ${oThis.userIdToFinalMap[userId].email}, ${
          oThis.userIdToFinalMap[userId].twitterHandle
        }, ${oThis.userIdToFinalMap[userId].inviteCode}, ${oThis.userIdToFinalMap[userId].isApproved}, ${
          oThis.userIdToFinalMap[userId].signupDate
        }, ${oThis.userIdToFinalMap[userId].videoCount}, ${totalPepoSpent}`
      );
    }
  }
}

module.exports = SignupsUsingInviteCode;
