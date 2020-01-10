/**
 * Script to undelete users.
 *
 * Example: executables/unDeleteUser.js --adminId 9
 *
 * @module executables/unDeleteUser.js
 */

const program = require('commander');

const rootPrefix = '..',
  TagModel = require(rootPrefix + '/app/models/mysql/Tag'),
  CronBase = require(rootPrefix + '/executables/CronBase'),
  UserModel = require(rootPrefix + '/app/models/mysql/User'),
  UsersCache = require(rootPrefix + '/lib/cacheManagement/multi/User'),
  AdminActivityLogModel = require(rootPrefix + '/app/models/mysql/AdminActivityLog'),
  AddContactInPepoCampaign = require(rootPrefix + '/lib/email/hookCreator/AddContact'),
  UserTagsCacheKlass = require(rootPrefix + '/lib/cacheManagement/multi/UserTagsByUserIds'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  userConstants = require(rootPrefix + '/lib/globalConstant/user'),
  userTagConstants = require(rootPrefix + '/lib/globalConstant/userTag'),
  adminActivityLogConstants = require(rootPrefix + '/lib/globalConstant/adminActivityLogs'),
  emailServiceApiCallHookConstants = require(rootPrefix + '/lib/globalConstant/emailServiceApiCallHook');

program
  .option('--adminId <adminId>', 'Admin Id')
  .option('--userId <userId>', 'User Id')
  .parse(process.argv);

program.on('--help', function() {
  logger.log('');
  logger.log('  Example:');
  logger.log('');
  logger.log('    node executables/unDeleteUser.js --adminId 9 --userId 5');
  logger.log('');
  logger.log('');
});

const adminId = +program.adminId,
  userId = +program.userId;

if (!adminId || !userId) {
  program.help();
  process.exit(1);
}

/**
 * Class to undelete user.
 *
 * @class UnDeleteUser
 */
class UnDeleteUser {
  /**
   * Constructor for undelete user.
   *
   * @augments CronBase
   *
   * @constructor
   */
  constructor(params) {
    const oThis = this;

    oThis.adminId = params.adminId;
    oThis.userId = params.userId;

    oThis.userObject = null;
  }

  /**
   * Perform
   *
   * @returns {Promise<void>}
   */
  async perform() {
    const oThis = this;

    await oThis._fetchUsers();

    let promiseArray = [];

    promiseArray.push(oThis._markUserActive());

    promiseArray.push(oThis._increaseUserTagWeight());

    promiseArray.push(oThis._addContactInCampaigns());

    await Promise.all(promiseArray);

    await oThis._logAdminActivity();
  }

  /**
   * Fetch users.
   *
   * @sets oThis.userObjects
   *
   * @returns {Promise<*>}
   * @private
   */
  async _fetchUsers() {
    const oThis = this;

    const cacheRsp = await new UsersCache({ ids: [oThis.userId] }).fetch();
    if (cacheRsp.isFailure()) {
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 'e_udu_1',
          api_error_identifier: 'invalid_params',
          debug_options: {
            userId: oThis.userId
          }
        })
      );
    }

    const userObj = cacheRsp.data[oThis.userId];

    if (userObj.status !== userConstants.inActiveStatus) {
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 'e_udu_2',
          api_error_identifier: 'could_not_proceed',
          debug_options: {
            userId: oThis.userId
          }
        })
      );
    }

    oThis.userObject = userObj;
  }

  /**
   * Mark user active
   *
   * @returns {Promise<void>}
   * @private
   */
  async _markUserActive() {
    const oThis = this;

    await new UserModel()
      .update({ status: userConstants.invertedStatuses[userConstants.activeStatus] })
      .where({ id: oThis.userId })
      .fire();

    await UserModel.flushCache(oThis.userObject);
  }

  /**
   * Increase user tag weight.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _increaseUserTagWeight() {
    const oThis = this;

    const userTagCacheResp = await new UserTagsCacheKlass({ userIds: [oThis.userId] }).fetch();

    const tagIds = userTagCacheResp.data[oThis.userId][userTagConstants.selfAddedKind] || [];

    if (tagIds && tagIds.length > 0) {
      await new TagModel().updateTagWeights(tagIds, 1);
      await TagModel.flushCache({ ids: tagIds });
    }
  }

  /**
   * Add contact in campaigns list.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _addContactInCampaigns() {
    const oThis = this,
      addContactParams = {
        receiverEntityId: oThis.userId,
        receiverEntityKind: emailServiceApiCallHookConstants.userEmailEntityKind,
        // TODO - have the same description as signup.
        customDescription: 'Contact add',
        customAttributes: {
          [emailServiceApiCallHookConstants.appSignupAttribute]: 1
        }
      };

    const addContactObj = new AddContactInPepoCampaign(addContactParams);

    await addContactObj.perform();
  }

  /**
   * Log admin activity.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _logAdminActivity() {
    const oThis = this;

    await new AdminActivityLogModel().insertAction({
      adminId: oThis.adminId,
      actionOn: oThis.userId,
      action: adminActivityLogConstants.unDeleteUser
    });
  }
}

const unDeleteUser = new UnDeleteUser({ adminId: adminId, userId: userId });

unDeleteUser
  .perform()
  .then(function() {
    logger.step('** Exiting process');
    logger.info('Script last run at: ', Date.now());
    process.exit(0);
  })
  .catch(function(err) {
    logger.error('** Exiting process due to Error: ', err);
    process.emit('SIGINT');
  });
