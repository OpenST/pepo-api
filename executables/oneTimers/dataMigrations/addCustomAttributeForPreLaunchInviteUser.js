/**
 * One timer to add custom attribute for pre launch invite user.
 *
 * Usage: node executables/oneTimers/addCustomAttributeForPreLaunchInviteUser.js
 *
 * @module executables/oneTimers/addCustomAttributeForPreLaunchInviteUser
 */
const command = require('commander');

const rootPrefix = '../../..',
  PreLaunchInviteModel = require(rootPrefix + '/app/models/mysql/PreLaunchInvite'),
  emailServiceApiCallHookConstants = require(rootPrefix + '/lib/globalConstant/big/emailServiceApiCallHook'),
  UpdateContactInPepoCampaign = require(rootPrefix + '/lib/email/hookCreator/UpdateContact'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  preLaunchInviteConstant = require(rootPrefix + '/lib/globalConstant/preLaunchInvite');

command
  .version('0.1.0')
  .usage('[options]')
  .option('-f, --preLaunchInviteId <preLaunchInviteId>', 'id of the pre launch invite table')
  .parse(process.argv);

/**
 * class for add custom attribute for pre launch invite user.
 *
 * @class
 */
class addCustomAttributeForPreLaunchInviteUser {
  /**
   * constructor to add custom attribute for pre launch invite user.
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

    oThis.preLaunchInviteId = command.preLaunchInviteId ? command.preLaunchInviteId : 0;
    oThis.totalRecords = 0;

    let limit = 25,
      offset = 0;
    while (true) {
      await oThis._fetchPreLaunchInvites(limit, offset);
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
  async _fetchPreLaunchInvites(limit, offset) {
    const oThis = this;

    let preLaunchInvitesData = await new PreLaunchInviteModel()
      .select('*')
      .where(['id > (?)', oThis.preLaunchInviteId])
      .where({ status: preLaunchInviteConstant.invertedStatuses[preLaunchInviteConstant.doptinStatus] })
      .limit(limit)
      .offset(offset)
      .order_by('id asc')
      .fire();

    for (let index = 0; index < preLaunchInvitesData.length; index++) {
      const preLaunchInviteObj = new PreLaunchInviteModel().formatDbData(preLaunchInvitesData[index]);
      await oThis._updateContactInPepoCampaign(preLaunchInviteObj.id);
    }

    oThis.totalRecords = preLaunchInvitesData.length;
  }

  /**
   * Update contact in pepo campaign
   *
   * @returns {Promise<void>}
   * @private
   */
  async _updateContactInPepoCampaign(receiverEntityId) {
    const oThis = this;

    let updateContactParams = {
      receiverEntityId: receiverEntityId,
      receiverEntityKind: emailServiceApiCallHookConstants.preLaunchInviteEntityKind,
      customDescription: 'Contact update for pre launch invite',
      customAttributes: {
        [emailServiceApiCallHookConstants.preLaunchAttribute]: 1
      }
    };

    await new UpdateContactInPepoCampaign(updateContactParams).perform();
  }
}

new addCustomAttributeForPreLaunchInviteUser({})
  .perform()
  .then(function(rsp) {
    process.exit(0);
  })
  .catch(function(err) {
    logger.log(err);
    process.exit(1);
  });
