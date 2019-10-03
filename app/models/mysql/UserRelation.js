const rootPrefix = '../../..',
  ModelBase = require(rootPrefix + '/app/models/mysql/Base'),
  userRelationConstants = require(rootPrefix + '/lib/globalConstant/userRelation'),
  databaseConstants = require(rootPrefix + '/lib/globalConstant/database');

// Declare variables.
const dbName = databaseConstants.userDbName;

/**
 * Class for user relation model.
 *
 * @class UserRelation
 */
class UserRelation extends ModelBase {
  /**
   * Constructor for user relation model.
   *
   * @augments ModelBase
   *
   * @constructor
   */
  constructor() {
    super({ dbName: dbName });

    const oThis = this;

    oThis.tableName = 'user_relations';
  }

  /**
   * Bitwise config.
   *
   * @return {object}
   */
  get bitwiseConfig() {
    return {
      relations: userRelationConstants.relations
    };
  }

  /**
   * Format db Data
   *
   * @param {Object} dbRow
   * @param {number} dbRow.id
   * @param {number} dbRow.user1_id
   * @param {number} dbRow.user2_id
   * @param {number} dbRow.relations
   * @param {number} dbRow.created_at
   * @param {number} dbRow.updated_at
   *
   * @return {object}
   */
  formatDbData(dbRow) {
    const oThis = this;

    const formattedData = {
      id: dbRow.id,
      user1Id: dbRow.user1_id,
      user2Id: dbRow.user2_id,
      relations: new UserRelation().getBitwiseArray('relations', dbRow.relations),
      createdAt: dbRow.created_at,
      updatedAt: dbRow.updated_at
    };

    return oThis.sanitizeFormattedData(formattedData);
  }

  /**
   * List of formatted column names that can be exposed by service.
   *
   * @returns {array}
   */
  safeFormattedColumnNames() {
    return ['id', 'user1Id', 'user2Id', 'relations', 'createdAt', 'updatedAt'];
  }

  /**
   * Fetch list of users who has blocked given user or given user has blocked them.
   *
   * @param userId
   * @returns {Promise<{}>}
   */
  async fetchUsersBlockedList(userId) {
    const oThis = this;

    // Blocking user is bi-relation approach
    // So user can be present in user1_id or user2_id
    let blockedByUser1Relation = userRelationConstants.invertedRelations[userRelationConstants.blockedByUser1Relation],
      blockedByUser2Relation = userRelationConstants.invertedRelations[userRelationConstants.blockedByUser2Relation];
    let userRelationRows = await oThis
      .select('*')
      .where([
        'user1_id = ? AND ((relations = relations | ?) ' + 'OR (relations = relations | ?))',
        userId,
        blockedByUser1Relation,
        blockedByUser2Relation
      ])
      .fire();

    let userBlockList = { [userId]: { hasBlocked: [], blockedBy: [] } };
    for (let index = 0; index < userRelationRows.length; index++) {
      let row = userRelationRows[index];
      let userRelationsArr = new UserRelation().getBitwiseArray('relations', row.relations);
      // If user has blocked the user
      if (userRelationsArr.indexOf(userRelationConstants.blockedByUser1Relation) > -1) {
        userBlockList[userId].hasBlocked.push(row.user2_id);
      }
      if (userRelationsArr.indexOf(userRelationConstants.blockedByUser2Relation) > -1) {
        userBlockList[userId].blockedBy.push(row.user2_id);
      }
    }

    return userBlockList;
  }

  /**
   * Index name
   *
   * @returns {string}
   */
  static get userRelationUniqueIndexName() {
    return 'uk_1';
  }
}

module.exports = UserRelation;
