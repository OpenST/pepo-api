/**
 * One timer to add custom attribute for active users.
 *
 * Usage: node executables/oneTimers/dataMigrations/backPopulateUuidInUsers.js
 *
 * @module executables/oneTimers/dataMigrations/backPopulateUuidInUsers
 */

const rootPrefix = '../../..',
  UserModel = require(rootPrefix + '/app/models/mysql/User'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger');

const uuidV4 = require('uuid/v4');

class BackPopulateUuidInUsers {
  constructor() {
    const oThis = this;

    oThis.usersMap = {};
    oThis.totalRows = null;
  }

  /**
   * Perform
   *
   * @returns {Promise<void>}
   */
  async perform() {
    const oThis = this;

    await oThis._performBatch();
  }

  /**
   * Perform batch
   *
   * @returns {Promise<void>}
   * @private
   */
  async _performBatch() {
    const oThis = this;

    let limit = 10,
      offset = 0;
    while (true) {
      await oThis._fetchOldUserIds(limit, offset);
      // No more records present to migrate
      if (oThis.totalRows === 0) {
        break;
      }

      await oThis._populateUuidForOldUsers();

      offset = offset + 10;
    }
  }

  /**
   * Fetch user ids of old users
   *
   * @returns {Promise<void>}
   * @private
   */
  async _fetchOldUserIds(limit, offset) {
    const oThis = this;

    let userObj = new UserModel();

    let responseRows = await userObj
      .select('*')
      .where(['external_user_id is NULL'])
      .limit(limit)
      .offset(offset)
      .fire();

    for (let i = 0; i < responseRows.length; i++) {
      let row = userObj.formatDbData(responseRows[i]);
      oThis.usersMap[row.id] = row;
    }

    oThis.totalRows = responseRows.length;

    logger.info('=====Ids', Object.keys(oThis.usersMap));
  }

  /**
   * Populate uuids in users
   *
   * @returns {Promise<void>}
   * @private
   */
  async _populateUuidForOldUsers() {
    const oThis = this;

    let promiseArray = [];

    for (let id in oThis.usersMap) {
      promiseArray.push(oThis._populateUuid(oThis.usersMap[id]));
    }

    await Promise.all(promiseArray);

    oThis.usersMap = {};
  }

  /**
   * Populate uuid
   *
   * @param params
   * @returns {Promise<*>}
   * @private
   */
  async _populateUuid(params) {
    const oThis = this;

    let userObj = new UserModel();

    await userObj
      .update({ external_user_id: uuidV4() })
      .where({ id: params.id })
      .fire();

    return UserModel.flushCache(params);
  }
}

new BackPopulateUuidInUsers()
  .perform()
  .then(function(r) {
    logger.win('All old users are populated with external uuids.');
    process.exit(0);
  })
  .catch(function(err) {
    logger.error('Error in back-populating. Error: ', err);
    process.exit(1);
  });
