/**
 * One timer to add custom attribute for active users.
 *
 * Usage: node executables/oneTimers/dataMigrations/addCustomAttributeForAllActiveUsers.js
 *
 * @module executables/oneTimers/dataMigrations/addCustomAttributeForAllActiveUsers
 */
const command = require('commander');

const rootPrefix = '../../..',
  UserModel = require(rootPrefix + '/app/models/mysql/User'),
  emailServiceApiCallHookConstants = require(rootPrefix + '/lib/globalConstant/big/emailServiceApiCallHook'),
  AddContactInPepoCampaign = require(rootPrefix + '/lib/email/hookCreator/AddContact'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  userConstants = require(rootPrefix + '/lib/globalConstant/user');

command
  .version('0.1.0')
  .usage('[options]')
  .option('-f, --userId <userId>', 'id of the users table')
  .parse(process.argv);

/**
 * class for add custom attribute for active users.
 *
 * @class
 */
class addCustomAttributeForAllActiveUsers {
  /**
   * constructor to add custom attribute for active users.
   */
  constructor(params) {
    const oThis = this;
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

    oThis.userId = command.userId ? command.userId : 0;
    oThis.totalRecords = 0;

    let limit = 25,
      offset = 0;
    while (true) {
      await oThis._fetchUsers(limit, offset);
      // No more records present to migrate
      if (oThis.totalRecords === 0) {
        break;
      }

      offset = offset + limit;
    }
  }

  /**
   * Fetch pre launch invites
   *
   * @param limit
   * @param offset
   * @returns {Promise<void>}
   * @private
   */
  async _fetchUsers(limit, offset) {
    const oThis = this;

    let usersData = await new UserModel()
      .select('*')
      .where({ status: userConstants.invertedStatuses[userConstants.activeStatus] })
      .where(['id > (?)', oThis.userId])
      .limit(limit)
      .offset(offset)
      .order_by('id asc')
      .fire();

    for (let index = 0; index < usersData.length; index++) {
      const userObj = new UserModel().formatDbData(usersData[index]);
      logger.log('The userObj.email is : ', userObj.email);
      if (userObj.email) {
        await oThis._addContactInPepoCampaign(userObj.id);
      }
    }

    oThis.totalRecords = usersData.length;
  }

  /**
   * Add contact in pepo campaign
   *
   * @returns {Promise<void>}
   * @private
   */
  async _addContactInPepoCampaign(receiverEntityId) {
    const oThis = this;

    let addContactParams = {
      receiverEntityId: receiverEntityId,
      receiverEntityKind: emailServiceApiCallHookConstants.userEmailEntityKind,
      customDescription: 'Contact add for back populated email for users.',
      customAttributes: {
        [emailServiceApiCallHookConstants.appSignupAttribute]: 1
      }
    };

    await new AddContactInPepoCampaign(addContactParams).perform();
  }
}

new addCustomAttributeForAllActiveUsers({})
  .perform()
  .then(function(rsp) {
    process.exit(0);
  })
  .catch(function(err) {
    logger.log(err);
    process.exit(1);
  });
