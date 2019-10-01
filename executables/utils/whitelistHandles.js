/*
 * Executable for whitelisting handles
 *
 * node executables/utils/whitelistHandles.js --handles '["abc","def","ghi"]'
 */

const command = require('commander');

const rootPrefix = '../..',
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  PreLaunchInviteModel = require(rootPrefix + '/app/models/mysql/PreLaunchInvite'),
  PreLaunchInviteByIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/PreLaunchInviteByIds'),
  SecurePreLaunchInviteCache = require(rootPrefix + '/lib/cacheManagement/single/SecurePreLaunchInvite'),
  prelaunchInviteConstants = require(rootPrefix + '/lib/globalConstant/preLaunchInvite'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

const BATCH_SIZE = 100;

command
  .version('0.1.0')
  .usage('[options]')
  .option('-f, --handles <handles>', 'array of handles to be whitelisted')
  .parse(process.argv);

/**
 * Class for whitelist handles
 *
 * @class
 */
class WhitelistHandles {
  /**
   * constructor to seed invite related tables table
   *
   * @constructor
   */
  constructor() {
    const oThis = this;

    oThis.handles = JSON.parse(command.handles);
    oThis.preLaunchInviteRows = [];
    oThis.alreadyWhitelistedHandles = [];
    oThis.toWhitelistHandles = [];
    oThis.toWhitelistPreLaunchInviteIds = [];
    oThis.processedHandles = [];
  }

  /**
   * Perform
   *
   * @returns {Promise<*|result>}
   */
  async perform() {
    const oThis = this;

    if (!CommonValidators.validateArray(oThis.handles)) {
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 'e_u_wh_1',
          api_error_identifier: 'something_went_wrong',
          debug_options: { handles: oThis.handles }
        })
      );
    }

    await oThis._fetchPreLaunchInvites();

    await oThis._segregateUsers();

    await oThis._whitelistUsers();

    const notWhitelisted = [];
    for (let ind = 0; ind < oThis.handles.length; ind++) {
      let handle = oThis.handles[ind];

      if (!oThis.processedHandles.includes(handle)) {
        notWhitelisted.push(handle);
      }
    }

    return responseHelper.successWithData({
      alreadyWhitelistedHandles: oThis.alreadyWhitelistedHandles,
      whitelistedNow: oThis.toWhitelistHandles,
      unknownHandles: notWhitelisted
    });
  }

  /**
   * Fetch pre launch invites records
   *
   * @returns {Promise<void>}
   * @private
   */
  async _fetchPreLaunchInvites() {
    const oThis = this;

    let unprocessedHandles = oThis.handles.slice(); // Slice clones the array

    while (unprocessedHandles.length > 0) {
      let handles = unprocessedHandles.splice(0, BATCH_SIZE);

      let preLaunchInviteObj = new PreLaunchInviteModel();

      let preLaunchInviteRowResp = await preLaunchInviteObj
        .select(['id', 'handle', 'admin_status'])
        .where({ handle: handles })
        .fire();

      oThis.preLaunchInviteRows = oThis.preLaunchInviteRows.concat(preLaunchInviteRowResp);
    }
  }

  /**
   * Segregate users based on the status
   *
   * @returns {Promise<void>}
   * @private
   */
  async _segregateUsers() {
    const oThis = this;

    let preLaunchInviteObj = new PreLaunchInviteModel();

    for (let ind = 0; ind < oThis.preLaunchInviteRows.length; ind++) {
      let inviteRow = preLaunchInviteObj.formatDbData(oThis.preLaunchInviteRows[ind]);

      oThis.processedHandles.push(inviteRow.handle);

      if (inviteRow.adminStatus === prelaunchInviteConstants.whitelistedStatus) {
        oThis.alreadyWhitelistedHandles.push(inviteRow.handle);
      } else {
        oThis.toWhitelistHandles.push(inviteRow.handle);
        oThis.toWhitelistPreLaunchInviteIds.push(inviteRow.id);
      }
    }
  }

  /**
   * Whitelist users
   *
   * @returns {Promise<void>}
   * @private
   */
  async _whitelistUsers() {
    const oThis = this;

    let preLaunchInviteObj = new PreLaunchInviteModel();

    while (oThis.toWhitelistPreLaunchInviteIds.length > 0) {
      let whiltelistIds = oThis.toWhitelistPreLaunchInviteIds.splice(0, BATCH_SIZE);

      await preLaunchInviteObj
        .update({
          admin_status: prelaunchInviteConstants.invertedAdminStatuses[prelaunchInviteConstants.whitelistedStatus]
        })
        .where({ id: whiltelistIds })
        .fire();

      await oThis._flushCache(whiltelistIds);
    }
  }

  /**
   * Flush caches
   *
   * @param ids
   * @returns {Promise<void>}
   * @private
   */
  async _flushCache(ids) {
    let promiseArray = [];

    if (ids.length == 0) {
      return;
    }

    promiseArray.push(new PreLaunchInviteByIdsCache({ ids: ids }).clear());

    for (let ind = 0; ind < ids.length; ind++) {
      promiseArray.push(new SecurePreLaunchInviteCache({ id: ids[ind] }).clear());
    }

    await Promise.all(promiseArray);
  }
}

new WhitelistHandles()
  .perform()
  .then(function(resp) {
    logger.win(resp.data);
  })
  .catch(function(err) {
    logger.error(err);
  });
