const rootPrefix = '../../..',
  ModelBase = require(rootPrefix + '/app/models/mysql/Base'),
  databaseConstants = require(rootPrefix + '/lib/globalConstant/database'),
  userProfileElementConst = require(rootPrefix + '/lib/globalConstant/userProfileElement');

// Declare variables.
const dbName = databaseConstants.userDbName;

/**
 * Class for user profile element model.
 *
 * @class UserProfileElementModel
 */
class UserProfileElementModel extends ModelBase {
  /**
   * Constructor for user profile element model.
   *
   * @augments ModelBase
   *
   * @constructor
   */
  constructor() {
    super({ dbName: dbName });

    const oThis = this;

    oThis.tableName = 'user_profile_elements';
  }

  /**
   * Format db data.
   *
   * @param {object} dbRow
   * @param {number} dbRow.id
   * @param {number} dbRow.user_id
   * @param {string} dbRow.data_kind
   * @param {object} dbRow.data
   * @param {number} dbRow.created_at
   * @param {number} dbRow.updated_at
   *
   * @return {object}
   */
  formatDbData(dbRow) {
    const oThis = this;

    const formattedData = {
      id: dbRow.id,
      userId: dbRow.user_id,
      dataKind: userProfileElementConst.kinds[dbRow.data_kind],
      data: dbRow.data,
      createdAt: dbRow.created_at,
      updatedAt: dbRow.updated_at
    };

    return oThis.sanitizeFormattedData(formattedData);
  }

  /**
   * Fetch user elements by user id.
   *
   * @param {array} userIds: user ids
   *
   * @return {Promise}
   */
  async fetchByUserIds(userIds) {
    const oThis = this;

    const dbRows = await oThis
      .select('*')
      .where(['user_id IN (?)', userIds])
      .fire();

    if (dbRows.length === 0) {
      return {};
    }

    const result = {};

    for (let ind = 0; ind < dbRows.length; ind++) {
      const userId = dbRows[ind].user_id;
      result[userId] = result[userId] || {};

      const formattedRow = oThis.formatDbData(dbRows[ind]);

      if (result.hasOwnProperty(userId)) {
        result[userId][formattedRow.dataKind] = formattedRow;
      } else {
        result[userId][formattedRow.dataKind] = formattedRow;
      }
    }

    return result;
  }

  /**
   * Insert profile element
   *
   * @return {Promise<*>}
   */
  async insertElement(params) {
    const oThis = this;

    const currentTime = Math.floor(Date.now() / 1000);

    return oThis
      .insert({
        user_id: params.userId,
        data_kind: userProfileElementConst.invertedKinds[params.dataKind],
        data: params.data,
        created_at: currentTime,
        updated_at: currentTime
      })
      .fire();
  }

  /**
   * Delete by user id and kind.
   *
   * @param {object} params
   * @param {number} params.userId
   * @param {string} params.dataKind
   *
   * @return {Promise<void>}
   */
  async deleteByUserIdAndKind(params) {
    const oThis = this;

    await oThis
      .delete()
      .where({
        user_id: params.userId,
        data_kind: userProfileElementConst.invertedKinds[params.dataKind]
      })
      .fire();

    return UserProfileElementModel.flushCache(params);
  }

  /**
   * Delete by id.
   *
   * @param {object} params
   * @param {number} params.id
   *
   * @return {Promise<void>}
   */
  async deleteById(params) {
    const oThis = this;

    await oThis
      .delete()
      .where({
        id: params.id
      })
      .fire();
  }

  /**
   * Flush cache.
   *
   * @param {object} params
   * @param {number} params.userId
   *
   * @returns {Promise<*>}
   */
  static async flushCache(params) {
    const UserProfileElementsByUserIds = require(rootPrefix +
      '/lib/cacheManagement/multi/UserProfileElementsByUserIds');

    await new UserProfileElementsByUserIds({ usersIds: [params.userId] }).clear();
  }
}

module.exports = UserProfileElementModel;
