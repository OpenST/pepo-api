const rootPrefix = '..',
  TextIncludeModel = require(rootPrefix + '/app/models/cassandra/TextInclude'),
  ReplyDetailsByIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/ReplyDetailsByIds'),
  UserIdByUserNamesCache = require(rootPrefix + '/lib/cacheManagement/multi/UserIdByUserNames'),
  TextIncludesByIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/TextIncludesByTextIds'),
  textIncludeConstants = require(rootPrefix + '/lib/globalConstant/cassandra/textInclude'),
  notificationJobEnqueue = require(rootPrefix + '/lib/rabbitMqEnqueue/notification'),
  userConstants = require(rootPrefix + '/lib/globalConstant/user'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  basicHelper = require(rootPrefix + '/helpers/basic'),
  notificationJobConstants = require(rootPrefix + '/lib/globalConstant/notificationJob'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

/**
 * @class
 *
 * Class to filter out tags from text
 */
class FilterAndPublishAtMentions {
  /**
   * @constructor
   *
   * Constructor of class to filter out text
   *
   * @param {string} params.text
   * @param {number} params.textId
   * @param {number} params.videoId
   * @param {number} params.currentUserId
   * @param {boolean} [params.isReplyOnVideo] - optional
   */
  constructor(params) {
    const oThis = this;
    oThis.textToFilter = params.text || '';
    oThis.textId = params.textId;
    oThis.currentUserId = params.currentUserId;
    oThis.videoId = params.videoId;
    oThis.isReplyOnVideo = params.isReplyOnVideo || false;

    oThis.mentionedUserIds = [];
    oThis.userIdsToRemoved = [];
    oThis.userIdToUserNamesWithPrefix = {};
    oThis.userNamesToUserIdMap = {};
  }

  /**
   * Perform operation
   *
   */
  async perform() {
    const oThis = this;

    await oThis._filterAtMentions();

    if (oThis.mentionedUserIds.length > 0) {
      await oThis._checkIfNewUsersHaveBeenMentioned();
    }

    await oThis._insertInTextIncludes();
    await oThis._deleteOldUserIdsFromCassandra();
    await oThis._publishNotifications();

    return responseHelper.successWithData({
      text: oThis.textToFilter,
      userIdToUserNamesWithPrefix: oThis.userIdToUserNamesWithPrefix,
      userNamesToUserIdMap: oThis.userNamesToUserIdMap,
      mentionedUserIds: oThis.mentionedUserIds
    });
  }

  /**
   * Check if new users have been mentioned.
   *
   * @returns {Promise<never>}
   * @private
   */
  async _checkIfNewUsersHaveBeenMentioned() {
    const oThis = this;

    let allReadyPresentUserIds = [];

    const cacheRsp = await new TextIncludesByIdsCache({ ids: [oThis.textId] }).fetch();

    if (cacheRsp.isFailure()) {
      return Promise.reject(cacheRsp);
    }

    const textIncludes = cacheRsp.data;

    for (const textId in textIncludes) {
      const includesForAllKinds = textIncludes[textId];

      for (let ind = 0; ind < includesForAllKinds.length; ind++) {
        const includeRow = includesForAllKinds[ind],
          entity = includeRow.entityIdentifier.split('_');

        if (entity[0] == textIncludeConstants.userEntityKindShort) {
          allReadyPresentUserIds.push(+entity[1]);
        }
      }
    }

    let newlyMentionedUserIds = oThis.mentionedUserIds;
    if (allReadyPresentUserIds.length > 0) {
      // new user mentioned, to be added in cassandra and publish notification
      oThis.mentionedUserIds = basicHelper.arrayDiff(newlyMentionedUserIds, allReadyPresentUserIds);
      // old users, who have been removed from description, remove from cassandra
      oThis.userIdsToRemoved = basicHelper.arrayDiff(allReadyPresentUserIds, newlyMentionedUserIds);
    }
  }

  /**
   * Filter tags from text
   *
   * @private
   */
  async _filterAtMentions() {
    const oThis = this;

    let filteredNamesWithPrefix = [],
      filteredNames = [];

    filteredNamesWithPrefix = oThis.textToFilter.match(/@\w+/g);

    if (!filteredNamesWithPrefix || filteredNamesWithPrefix.length === 0) {
      return;
    }

    for (let ind = 0; ind < filteredNamesWithPrefix.length; ind++) {
      filteredNames.push(filteredNamesWithPrefix[ind].substring(1).toLowerCase());
    }

    const userIdByUserNamesCacheRsp = await new UserIdByUserNamesCache({ userNames: filteredNames }).fetch();

    if (userIdByUserNamesCacheRsp.isFailure() || !userIdByUserNamesCacheRsp.data) {
      return Promise.reject(userIdByUserNamesCacheRsp);
    }

    let userNamesToUserIdMap = userIdByUserNamesCacheRsp.data;

    for (let ind = 0; ind < filteredNames.length; ind++) {
      let filteredName = filteredNames[ind];

      if (
        !userNamesToUserIdMap[filteredName].id ||
        userNamesToUserIdMap[filteredName].status !== userConstants.activeStatus
      ) {
        continue;
      }

      // to avoid self mentions
      if (oThis.currentUserId == userNamesToUserIdMap[filteredName].id) {
        continue;
      }

      const userId = userNamesToUserIdMap[filteredName].id;

      oThis.userIdToUserNamesWithPrefix[userId] = filteredNamesWithPrefix[ind];
      oThis.userNamesToUserIdMap[filteredName] = userId;
      oThis.mentionedUserIds.push(userId);
    }
  }

  /**
   * Insert text includes for user names.
   * @returns {Promise<void>}
   * @private
   */
  async _insertInTextIncludes() {
    const oThis = this;

    const entityIdentifiersArray = [],
      replaceableTextsArray = [];

    for (let ind = 0; ind < oThis.mentionedUserIds.length; ind++) {
      let userId = oThis.mentionedUserIds[ind];

      entityIdentifiersArray.push(
        textIncludeConstants.createEntityIdentifier(
          textIncludeConstants.shortToLongNamesMapForEntityKind[textIncludeConstants.userEntityKind],
          userId
        )
      );

      replaceableTextsArray.push(oThis.userIdToUserNamesWithPrefix[userId]);
    }

    await new TextIncludeModel().insertInTextIncludes(oThis.textId, entityIdentifiersArray, replaceableTextsArray);
  }

  /**
   * Delete old user ids from cassandra.
   * @returns {Promise<void>}
   * @private
   */
  async _deleteOldUserIdsFromCassandra() {
    const oThis = this;

    const entityIdentifiersArray = [];

    if (oThis.userIdsToRemoved.length === 0) {
      return;
    }

    for (let ind = 0; ind < oThis.userIdsToRemoved.length; ind++) {
      entityIdentifiersArray.push(
        textIncludeConstants.createEntityIdentifier(
          textIncludeConstants.shortToLongNamesMapForEntityKind[textIncludeConstants.userEntityKind],
          oThis.userIdsToRemoved[ind]
        )
      );
    }

    await new TextIncludeModel().deleteRowsForTextId(oThis.textId, entityIdentifiersArray);
  }

  /**
   * Publish notifications
   * @returns {Promise<void>}
   * @private
   */
  async _publishNotifications() {
    const oThis = this;

    if (oThis.mentionedUserIds.length === 0) {
      return;
    }

    if (oThis.isReplyOnVideo) {
      await oThis._getReplyDetails();

      await notificationJobEnqueue.enqueue(notificationJobConstants.replyUserMention, {
        userId: oThis.currentUserId,
        replyDetailId: oThis.replyDetail.id,
        videoId: oThis.replyDetail.entityId,
        mentionedUserIds: oThis.mentionedUserIds
      });
    } else {
      // Notification would be published only if user is approved.
      await notificationJobEnqueue.enqueue(notificationJobConstants.userMention, {
        userId: oThis.currentUserId,
        videoId: oThis.videoId,
        mentionedUserIds: oThis.mentionedUserIds
      });
    }
  }

  /**
   * Get reply details.
   *
   * @sets oThis.replyDetail
   *
   * @returns {Promise<never>}
   * @private
   */
  async _getReplyDetails() {
    const oThis = this;
    const replyDetailCacheResp = await new ReplyDetailsByIdsCache({ ids: [oThis.replyDetail.id] }).fetch();

    if (replyDetailCacheResp.isFailure()) {
      logger.error('Error while fetching reply detail data for reply_detail_id:', oThis.replyDetail.id);

      return Promise.reject(replyDetailCacheResp);
    }

    oThis.replyDetail = replyDetailCacheResp.data[oThis.replyDetail.id];
  }
}

module.exports = FilterAndPublishAtMentions;
