const rootPrefix = '..',
  TextIncludeModel = require(rootPrefix + '/app/models/cassandra/TextInclude'),
  UserIdByUserNamesCache = require(rootPrefix + '/lib/cacheManagement/multi/UserIdByUserNames'),
  TextIncludesByIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/TextIncludesByTextIds'),
  textIncludeConstants = require(rootPrefix + '/lib/globalConstant/cassandra/textInclude'),
  userConstants = require(rootPrefix + '/lib/globalConstant/user'),
  basicHelper = require(rootPrefix + '/helpers/basic'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

/**
 * @class
 *
 * Class to filter out at mentions from text.
 */
class FilterAtMentions {
  /**
   * Constructor of class to filter out at mentions from text.
   *
   * @param {string} params.text
   * @param {number} params.textId
   */
  constructor(params) {
    const oThis = this;
    oThis.textToFilter = params.text || '';
    oThis.textId = params.textId;

    oThis.mentionedUserIds = [];
    oThis.userIdsToRemoved = [];
    oThis.userIdsToAdd = [];
    oThis.userIdToUserNamesWithPrefix = {};
    oThis.userNamesToUserIdMap = {};
  }

  /**
   * Perform operation.
   *
   * @returns {Promise<*|result>}
   */
  async perform() {
    const oThis = this;

    await oThis._filterAtMentions();

    // To make filtered names unique.
    oThis.mentionedUserIds = [...new Set(oThis.mentionedUserIds)];

    if (oThis.mentionedUserIds.length > 0) {
      await oThis._checkIfNewUsersHaveBeenMentioned();
    }

    await oThis._insertInTextIncludes();
    await oThis._deleteOldUserIdsFromCassandra();

    return responseHelper.successWithData({
      text: oThis.textToFilter,
      userIdToUserNamesWithPrefix: oThis.userIdToUserNamesWithPrefix,
      userNamesToUserIdMap: oThis.userNamesToUserIdMap,
      mentionedUserIds: oThis.mentionedUserIds, // all mentioned users in current text
      newlyMentionedUserId: oThis.userIdsToAdd // newly mentioned users
    });
  }

  /**
   * Filter at mentioned users from text.
   *
   * @private
   */
  async _filterAtMentions() {
    const oThis = this;

    let filteredNames = [],
      filteredNamesWithPrefix = oThis.textToFilter.match(/(^|\s)@\w+/g);

    if (!filteredNamesWithPrefix || filteredNamesWithPrefix.length === 0) {
      return;
    }

    for (let ind = 0; ind < filteredNamesWithPrefix.length; ind++) {
      filteredNamesWithPrefix[ind] = filteredNamesWithPrefix[ind].trim();
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

      const userId = userNamesToUserIdMap[filteredName].id;

      oThis.userIdToUserNamesWithPrefix[userId] = filteredNamesWithPrefix[ind];
      oThis.userNamesToUserIdMap[filteredName] = userId;
      oThis.mentionedUserIds.push(userId);
    }
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
    // new user mentioned, to be added in cassandra and publish notification
    oThis.userIdsToAdd = basicHelper.arrayDiff(newlyMentionedUserIds, allReadyPresentUserIds);
    // old users, who have been removed from description, remove from cassandra
    oThis.userIdsToRemoved = basicHelper.arrayDiff(allReadyPresentUserIds, newlyMentionedUserIds);
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

    for (let ind = 0; ind < oThis.userIdsToAdd.length; ind++) {
      let userId = oThis.userIdsToAdd[ind];

      entityIdentifiersArray.push(
        textIncludeConstants.createEntityIdentifier(
          textIncludeConstants.shortToLongNamesMapForEntityKind[textIncludeConstants.userEntityKind],
          userId
        )
      );

      let replaceableUserName = oThis.userIdToUserNamesWithPrefix[userId].toLowerCase();
      replaceableTextsArray.push(replaceableUserName);
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
}

module.exports = FilterAtMentions;
