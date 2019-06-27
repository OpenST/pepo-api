const rootPrefix = '../../..',
  ModelBase = require(rootPrefix + '/app/models/mysql/Base'),
  coreConstants = require(rootPrefix + '/config/coreConstants'),
  userProfileElementConst = require(rootPrefix + '/lib/globalConstant/userProfileElement');

const dbName = 'pepo_api_' + coreConstants.environment;

class UserProfileElementModel extends ModelBase {
  /**
   * UserFeed model
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

  /***
   * Fetch user elements by user id
   *
   * @param userId {Integer} - id
   *
   * @return {Object}
   */
  async fetchByUserId(userId) {
    const oThis = this;
    let dbRows = await oThis
      .select('*')
      .where({ user_id: userId })
      .fire();

    if (dbRows.length === 0) {
      return {};
    }

    let result = {};

    for (let i = 0; i < dbRows.length; i++) {
      result[dbRows[i].id] = oThis.formatDbData(dbRows[i]);
    }

    return result;
  }

  /**
   * Insert profile element
   *
   * @return {Promise<void>}
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
}

module.exports = UserProfileElementModel;
