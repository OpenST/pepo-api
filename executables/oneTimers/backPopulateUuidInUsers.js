const rootPrefix = '../..',
  UserModel = require(rootPrefix + '/app/models/mysql/User'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger');

const uuidV4 = require('uuid/v4');

class BackPopulateUuidInUsers {
  constructor() {
    const oThis = this;

    oThis.usersMap = {};
  }

  /**
   * Perform
   *
   * @returns {Promise<void>}
   */
  async perform() {
    const oThis = this;

    await oThis._fetchOldUserIds();

    await oThis._populateUuidForOldUsers();
  }

  /**
   * Fetch user ids of old users
   *
   * @returns {Promise<void>}
   * @private
   */
  async _fetchOldUserIds() {
    const oThis = this;

    let userObj = new UserModel();

    let responseRows = await userObj
      .select('*')
      .where(['external_user_id is NULL'])
      .fire();

    for (let i = 0; i < responseRows.length; i++) {
      let row = userObj.formatDbData(responseRows[i]);
      oThis.usersMap[row.id] = row;
    }

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
