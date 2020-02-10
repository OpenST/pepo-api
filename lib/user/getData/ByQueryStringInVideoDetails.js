const rootPrefix = '../../..',
  UserModel = require(rootPrefix + '/app/models/mysql/User'),
  TextModel = require(rootPrefix + '/app/models/mysql/Text'),
  UserStatModel = require(rootPrefix + '/app/models/mysql/UserStat'),
  InviteCodeModel = require(rootPrefix + '/app/models/mysql/InviteCode'),
  TwitterUserModel = require(rootPrefix + '/app/models/mysql/TwitterUser'),
  VideoDetailModel = require(rootPrefix + '/app/models/mysql/VideoDetail'),
  basicHelper = require(rootPrefix + '/helpers/basic'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  textConstants = require(rootPrefix + '/lib/globalConstant/text'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

class GetDataByQueryStringInVideoDetails {
  /**
   * @constructor
   *
   * @param params
   * @param {array} params.words - Words to search in video description.
   */
  constructor(params) {
    const oThis = this;
    oThis.words = params.words;

    oThis.descriptionIds = [];
    oThis.userIds = [];
    oThis.userIdToInviteCodeMap = {};
    oThis.userIdToUserDetailsMap = {};
    oThis.userToVideoDetailsMap = {};
    oThis.userIdToTwitterDetailsMap = {};
    oThis.userIdToUserStats = {};
    oThis.userIdToFinalMap = {};
  }

  /**
   * Perform
   *
   * @return {Promise<void>}
   */
  async perform() {
    const oThis = this;

    await oThis._getVideoDescriptionIds();

    await oThis._getUserIds();

    const promisesArray = [];

    promisesArray.push(
      oThis._getInviteCodes(),
      oThis.fetchUserDetails(),
      oThis.fetchTwitterDetails(),
      oThis.fetchUserVideoDetails(),
      oThis.fetchUserStats()
    );
    await Promise.all(promisesArray);

    oThis.finalResponse();
    oThis.printResponse();

    return responseHelper.successWithData({});
  }

  /**
   * Get video description ids which contains required words.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _getVideoDescriptionIds() {
    const oThis = this;

    let whereClause = [];

    for (let index = 0; index < oThis.words.length; index++) {
      whereClause.push(`text like '%${oThis.words[index]} %'`);
    }
    whereClause = whereClause.join(' OR ');

    logger.log('whereClause =====', whereClause);
    const textResp = await new TextModel({})
      .select('*')
      .where({
        kind: textConstants.invertedKinds[textConstants.videoDescriptionKind]
      })
      .where(whereClause)
      .fire();

    for (let index = 0; index < textResp.length; index++) {
      oThis.descriptionIds.push(textResp[index].id);
    }
  }

  /**
   * Get user ids.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _getUserIds() {
    const oThis = this;

    if (oThis.descriptionIds.length === 0) {
      return Promise.reject(new Error('No video description ids found.'));
    }
    const videoDetailsResp = await new VideoDetailModel()
      .select('*')
      .where({ description_id: oThis.descriptionIds })
      .fire();

    for (let index = 0; index < videoDetailsResp.length; index++) {
      oThis.userIds.push(videoDetailsResp[index].creator_user_id);
    }

    oThis.userIds = [...new Set(oThis.userIds)];
  }

  /**
   * Get invite codes.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _getInviteCodes() {
    const oThis = this;

    const inviteCodeModelResp = await new InviteCodeModel()
      .select('*')
      .where(['user_id IN (?)', oThis.userIds])
      .fire();

    logger.log('inviteCodeModelResp =====', inviteCodeModelResp);
    for (let index = 0; index < inviteCodeModelResp.length; index++) {
      const row = inviteCodeModelResp[index];
      oThis.userIdToInviteCodeMap[row.user_id] = row.code;
    }
    logger.log('oThis.userIdToInviteCodeMap =====', oThis.userIdToInviteCodeMap);
  }

  /**
   * Fetch user details.
   *
   * @returns {Promise<never>}
   */
  async fetchUserDetails() {
    const oThis = this;

    if (oThis.userIds.length === 0) {
      return Promise.reject(new Error('No userIds found.'));
    }

    logger.log('oThis.userIds =====', oThis.userIds);

    const userModelResponse = await new UserModel()
      .select('*')
      .where(['id IN (?)', oThis.userIds])
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

    if (oThis.userIds.length === 0) {
      return Promise.reject(new Error('No userIds found.'));
    }

    const twitterDetailsResponse = await new TwitterUserModel()
      .select('handle, user_id')
      .where(['user_id IN (?)', oThis.userIds])
      .fire();

    for (let index = 0; index < twitterDetailsResponse.length; index++) {
      const twitterDetails = twitterDetailsResponse[index];
      logger.log('twitterDetails =====', twitterDetails);
      oThis.userIdToTwitterDetailsMap[twitterDetails.user_id] = twitterDetails.handle;
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

    if (oThis.userIds.length === 0) {
      return Promise.reject(new Error('No userIds found.'));
    }

    const videoDetailsResponse = await new VideoDetailModel()
      .select('count (*) as total_videos, creator_user_id')
      .where(['creator_user_id IN (?)', oThis.userIds])
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

    if (oThis.userIds.length === 0) {
      return Promise.reject(new Error('No userIds found.'));
    }

    const userStatResponse = await new UserStatModel()
      .select('total_amount_spent, user_id')
      .where(['user_id IN (?)', oThis.userIds])
      .fire();

    logger.log('===== userStatResponse ======', userStatResponse);

    for (let index = 0; index < userStatResponse.length; index++) {
      const userStat = userStatResponse[index];
      logger.log('===== userStat ======', userStat);
      oThis.userIdToUserStats[userStat.user_id] = userStat.total_amount_spent;
    }
    logger.log('==11111111=== userStatResponse ======');
  }

  /**
   * Get final response.
   *
   * @sets oThis.userIdToFinalMap
   */
  finalResponse() {
    const oThis = this;

    for (let index = 0; index < oThis.userIds.length; index++) {
      const userId = oThis.userIds[index];
      oThis.userIdToFinalMap[userId] = {
        inviteCode: oThis.userIdToInviteCodeMap[userId] || '',
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
   * Print response.
   */
  printResponse() {
    const oThis = this;

    logger.log('userName, email, twitterHandle, inviteCodeUsed, isApprovedCreator, videoCount, pepoSpent');

    for (const userId in oThis.userIdToFinalMap) {
      const totalPepoSpent = Number(oThis.userIdToFinalMap[userId].totalPepoSpent) / Number(1000000000000000000);
      logger.log(
        `${oThis.userIdToFinalMap[userId].userName}, ${oThis.userIdToFinalMap[userId].email}, ${
          oThis.userIdToFinalMap[userId].twitterHandle
        }, ${oThis.userIdToFinalMap[userId].inviteCode}, ${oThis.userIdToFinalMap[userId].isApproved}, ${
          oThis.userIdToFinalMap[userId].videoCount
        }, ${totalPepoSpent}`
      );
    }
  }
}

module.exports = GetDataByQueryStringInVideoDetails;
