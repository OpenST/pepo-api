const rootPrefix = '..',
  TextIncludeModel = require(rootPrefix + '/app/models/cassandra/TextInclude'),
  UserIdByUserNamesCache = require(rootPrefix + '/lib/cacheManagement/multi/UserIdByUserNames'),
  TextIncludesByIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/TextIncludesByTextIds'),
  basicHelper = require(rootPrefix + '/helpers/basic'),
  userConstants = require(rootPrefix + '/lib/globalConstant/user'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  textIncludeConstants = require(rootPrefix + '/lib/globalConstant/cassandra/textInclude');

/**
 * Class to filter out at mentions from text.
 *
 * @class FilterAtMentions
 */
class FilterAtMentions {
  /**
   * Constructor of class to filter out at mentions from text.
   *
   * @param {string} params.text
   * @param {number} params.textId
   * @param {number} params.currentUserId
   *
   * @constructor
   */
  constructor(params) {
    const oThis = this;

    oThis.textToFilter = params.text || '';
    oThis.textId = params.textId;
    oThis.currentUserId = params.currentUserId;

    oThis.mentionedUserIds = [];
    oThis.userIdsToRemoved = [];
    oThis.userIdToUserNamesWithPrefix = {};
    oThis.userNamesToUserIdMap = {};
  }

  /**
   * Main performer for class.
   *
   * @returns {Promise<*|result>}
   */
  async perform() {
    const oThis = this;

    await oThis._filterAtMentions();

    if (oThis.mentionedUserIds.length > 0) {
      await oThis._checkIfNewUsersHaveBeenMentioned();
    }

    await oThis._insertInTextIncludes();
    await oThis._deleteOldUserIdsFromCassandra();

    return responseHelper.successWithData({
      text: oThis.textToFilter,
      userIdToUserNamesWithPrefix: oThis.userIdToUserNamesWithPrefix,
      userNamesToUserIdMap: oThis.userNamesToUserIdMap,
      mentionedUserIds: oThis.mentionedUserIds
    });
  }

  /**
   * Filter at mentions from text.
   *
   * @sets oThis.userIdToUserNamesWithPrefix, oThis.userNamesToUserIdMap, oThis.mentionedUserIds
   *
   * @returns {Promise<*>}
   * @private
   */
  async _filterAtMentions() {
    const oThis = this;

    const filteredNames = [],
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

    const userNamesToUserIdMap = userIdByUserNamesCacheRsp.data;

    for (let ind = 0; ind < filteredNames.length; ind++) {
      const filteredName = filteredNames[ind];

      if (
        !userNamesToUserIdMap[filteredName].id ||
        userNamesToUserIdMap[filteredName].status !== userConstants.activeStatus
      ) {
        continue;
      }

      // To avoid self mentions.
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
   * Check if new users have been mentioned.
   *
   * @sets oThis.mentionedUserIds, oThis.userIdsToRemoved
   *
   * @returns {Promise<never>}
   * @private
   */
  async _checkIfNewUsersHaveBeenMentioned() {
    const oThis = this;

    const allReadyPresentUserIds = [];

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

        if (entity[0] === textIncludeConstants.userEntityKindShort) {
          allReadyPresentUserIds.push(+entity[1]);
        }
      }
    }

    const newlyMentionedUserIds = oThis.mentionedUserIds;
    if (allReadyPresentUserIds.length > 0) {
      // New user mentioned, to be added in cassandra and publish notification.
      oThis.mentionedUserIds = basicHelper.arrayDiff(newlyMentionedUserIds, allReadyPresentUserIds);
      // Old users, who have been removed from description, remove from cassandra.
      oThis.userIdsToRemoved = basicHelper.arrayDiff(allReadyPresentUserIds, newlyMentionedUserIds);
    }
  }

  /**
   * Insert text includes for user names.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _insertInTextIncludes() {
    const oThis = this;

    const entityIdentifiersArray = [],
      replaceableTextsArray = [];

    for (let ind = 0; ind < oThis.mentionedUserIds.length; ind++) {
      const userId = oThis.mentionedUserIds[ind];

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
   *
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
}

module.exports = FilterAtMentions;
