const rootPrefix = '../../..',
  ModelBase = require(rootPrefix + '/app/models/mysql/Base'),
  coreConstants = require(rootPrefix + '/config/coreConstants'),
  userProfileElementConst = require(rootPrefix + '/lib/globalConstant/userProfileElement');

const dbName = 'pepo_api_' + coreConstants.environment;

class UserProfileElementModel extends ModelBase {
  /**
   *
   * @constructor
   */
  constructor() {
    super({ dbName: dbName });

    const oThis = this;

    oThis.tableName = 'user_profile_elements';
  }

  /**
   * Format db data
   *
   * @param dbRow
   * @return {object}
   */
  formatDbData(dbRow) {
    return {
      id: dbRow.id,
      userId: dbRow.user_id,
      dataKind: userProfileElementConst.kinds[dbRow.data_kind],
      data: dbRow.data,
      createdAt: dbRow.created_at,
      updatedAt: dbRow.updated_at
    };
  }

  /**
   * Fetch user elements by user id
   *
   * @param userIds {array} - user ids
   *
   * @return {Promise}
   */
  async fetchByUserIds(userIds) {
    const oThis = this;
    let dbRows = await oThis
      .select('*')
      .where(['user_id IN (?)', userIds])
      .fire();

    if (dbRows.length === 0) {
      return {};
    }

    let result = {};

    for (let ind = 0; ind < dbRows.length; ind++) {
      let userId = dbRows[ind].user_id;

      if (result.hasOwnProperty(userId)) {
        result[userId].push(oThis.formatDbData(dbRows[ind]));
      } else {
        result[userId] = [oThis.formatDbData(dbRows[ind])];
      }
    }

    return result;
  }

  /**
   * Insert profile element
   *
   * @return {Promise}
   */
  async insertElement(params) {
    const oThis = this,
      currentTime = Math.floor(Date.now() / 1000);

    let response = await oThis
      .insert({
        user_id: params.userId,
        data_kind: userProfileElementConst.invertedKinds[params.dataKind],
        data: params.data,
        created_at: currentTime,
        updated_at: currentTime
      })
      .fire();

    return response.data;
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

    await new UserProfileElementsByUserIds({
      userIds: [params.userId]
    }).clear();
  }
}

module.exports = UserProfileElementModel;
