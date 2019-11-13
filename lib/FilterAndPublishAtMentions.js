const rootPrefix = '..',
  TextIncludeModel = require(rootPrefix + '/app/models/cassandra/TextInclude'),
  UserIdByUserNamesCache = require(rootPrefix + '/lib/cacheManagement/multi/UserIdByUserNames'),
  textIncludeConstants = require(rootPrefix + '/lib/globalConstant/cassandra/textInclude'),
  notificationJobEnqueue = require(rootPrefix + '/lib/rabbitMqEnqueue/notification'),
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
   */
  constructor(params) {
    const oThis = this;
    oThis.textToFilter = params.text || '';
    oThis.textId = params.textId;
    oThis.currentUserId = params.currentUserId;
    oThis.videoId = params.videoId;

    oThis.mentionedUserIds = [];
    oThis.userNamesWithPrefix = [];
    oThis.userNamesToUserIdMap = {};
  }

  /**
   * Perform operation
   *
   */
  async perform() {
    const oThis = this;

    await oThis._filterAtMentions();

    if (oThis.userNamesWithPrefix && oThis.userNamesWithPrefix.length > 0) {
      await oThis._insertInTextIncludes();
    }

    await oThis._publishNotifications();

    return responseHelper.successWithData({
      text: oThis.textToFilter,
      userNamesWithPrefix: oThis.userNamesWithPrefix,
      userNamesToUserIdMap: oThis.userNamesToUserIdMap
    });
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

      if (!userNamesToUserIdMap[filteredName].id) {
        continue;
      }

      const userId = userNamesToUserIdMap[filteredName].id;

      oThis.userNamesWithPrefix.push(filteredNamesWithPrefix[ind]);
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

    for (let ind = 0; ind < oThis.userNamesWithPrefix.length; ind++) {
      let userName = oThis.userNamesWithPrefix[ind].substring(1).toLowerCase();

      let userId = oThis.userNamesToUserIdMap[userName];

      let a = textIncludeConstants.createEntityIdentifier(
        textIncludeConstants.shortToLongNamesMapForEntityKind[textIncludeConstants.userEntityKind],
        userId
      );

      entityIdentifiersArray.push(a);

      replaceableTextsArray.push(oThis.userNamesWithPrefix[ind]);
    }

    await new TextIncludeModel().insertInTextIncludes(oThis.textId, entityIdentifiersArray, replaceableTextsArray);
  }

  /**
   * Publish notifications
   * @returns {Promise<void>}
   * @private
   */
  async _publishNotifications() {
    const oThis = this;

    // Notification would be published only if user is approved.
    await notificationJobEnqueue.enqueue(notificationJobConstants.userMention, {
      userId: oThis.currentUserId,
      videoId: oThis.videoId,
      mentionedUserIds: oThis.mentionedUserIds
    });
  }
}

module.exports = FilterAndPublishAtMentions;
