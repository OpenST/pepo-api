/**
 * One time to seed invite related tables.
 *
 * Usage: node executables/oneTimers/inviteSeed.js
 *
 * @module executables/oneTimers/inviteSeed
 */
const command = require('commander');

const rootPrefix = '../..',
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  PreLaunchInviteModel = require(rootPrefix + '/app/models/mysql/PreLaunchInvite'),
  InviteCodeModel = require(rootPrefix + '/app/models/mysql/InviteCode'),
  inviteCodeConstants = require(rootPrefix + '/lib/globalConstant/inviteCode'),
  preLaunchInviteConstant = require(rootPrefix + '/lib/globalConstant/preLaunchInvite');

command
  .version('0.1.0')
  .usage('[options]')
  .option('-f, --preLaunchInviteId <preLaunchInviteId>', 'id of the pre launch invite table')
  .parse(process.argv);

/**
 * class for seed tokens table
 *
 * @class
 */
class InviteSeed {
  /**
   * constructor to seed invite related tables table
   *
   * @constructor
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

  async _performBatch() {
    const oThis = this;

    oThis.preLaunchInviteId = command.preLaunchInviteId ? command.preLaunchInviteId : 0;

    let limit = 100,
      offset = 0;
    while (true) {
      await oThis._fetchPreLaunchInvites(limit, offset);
      // No more records present to migrate
      if (!CommonValidators.validateNonEmptyObject(oThis.preLaunchInvitesByInviteCode)) {
        break;
      }

      await oThis._seedInviteCodes();

      await oThis._fetchInviteCodes();

      await oThis._updatePreLaunchInvitesAndInviteCodes();

      offset = offset + 100;
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

    oThis.preLaunchInvitesByInviteCode = {};
    oThis.preLaunchInvitesById = {};
    oThis.inviterInviteCodes = [];

    let preLaunchInvitesData = await new PreLaunchInviteModel()
      .select('*')
      .where(['id > (?)', oThis.preLaunchInviteId])
      .limit(limit)
      .offset(offset)
      .fire();

    for (let index = 0; index < preLaunchInvitesData.length; index++) {
      const formatDbRow = new PreLaunchInviteModel().formatDbData(preLaunchInvitesData[index]);
      oThis.preLaunchInvitesByInviteCode[formatDbRow.inviteCode] = formatDbRow;
      oThis.preLaunchInvitesById[formatDbRow.id] = formatDbRow;
    }

    for (let inviteCode in oThis.preLaunchInvitesByInviteCode) {
      let preLaunchInviteObj = oThis.preLaunchInvitesByInviteCode[inviteCode],
        inviterUserId = preLaunchInviteObj.inviterUserId;

      if (inviterUserId) {
        let inviterCode = null;
        if (CommonValidators.validateNonEmptyObject(oThis.preLaunchInvitesById[inviterUserId])) {
          let preLaunchInviteByIdObj = oThis.preLaunchInvitesById[inviterUserId],
            inviterCode = preLaunchInviteByIdObj.inviteCode;
        } else {
          let preLaunchInviteObj = await new PreLaunchInviteModel().fetchById(inviterUserId);
          inviterCode = preLaunchInviteObj.inviteCode;
          oThis.preLaunchInvitesById[preLaunchInviteObj.id] = preLaunchInviteObj;
        }

        if (inviterCode) {
          oThis.inviterInviteCodes.push(inviterCode);
        }
      }
    }
  }

  /**
   * Seed invite codes from pre launch invites
   *
   * @returns {Promise<>}
   * @private
   */
  async _seedInviteCodes() {
    const oThis = this;

    let bulkInsertVal = [];

    for (let inviteCode in oThis.preLaunchInvitesByInviteCode) {
      let preLaunchInviteObj = oThis.preLaunchInvitesByInviteCode[inviteCode],
        inviteLimit =
          preLaunchInviteObj.creatorStatus === preLaunchInviteConstant.approvedCreatorStatus
            ? inviteCodeConstants.infiniteInviteLimit
            : inviteCodeConstants.inviteMaxLimit;

      bulkInsertVal.push([inviteCode, inviteLimit]);
    }

    await new InviteCodeModel().insertMultiple(['code', 'invite_limit'], bulkInsertVal).fire();
  }

  /**
   * Fetch invite codes
   *
   * @returns {Promise<void>}
   * @private
   */
  async _fetchInviteCodes() {
    const oThis = this;

    oThis.inviteCodesByCode = {};

    let allInviteCodes = oThis.inviterInviteCodes.concat(Object.keys(oThis.preLaunchInvitesByInviteCode)),
      notDuplicateInviteCodes = [...new Set(allInviteCodes)];

    let inviteCodesData = await new InviteCodeModel()
      .select('*')
      .where(['code IN (?)', notDuplicateInviteCodes])
      .fire();

    for (let index = 0; index < inviteCodesData.length; index++) {
      const formatDbRow = new InviteCodeModel().formatDbData(inviteCodesData[index]);
      oThis.inviteCodesByCode[formatDbRow.code] = formatDbRow;
    }
  }

  /**
   * Inserts data in tokens table.
   *
   * @returns {Promise<>}
   * @private
   */
  async _updatePreLaunchInvitesAndInviteCodes() {
    const oThis = this;

    for (let inviteCode in oThis.preLaunchInvitesByInviteCode) {
      let inviterCodeId = null,
        preLaunchInviteByIdObj = {},
        inviterInviteCode = null;

      let preLaunchInviteByInviteCodeObj = oThis.preLaunchInvitesByInviteCode[inviteCode];

      if (preLaunchInviteByInviteCodeObj.inviterUserId) {
        preLaunchInviteByIdObj = oThis.preLaunchInvitesById[preLaunchInviteByInviteCodeObj.inviterUserId];
        inviterInviteCode = preLaunchInviteByIdObj.inviteCode;
        inviterCodeId = oThis.inviteCodesByCode[inviterInviteCode].id;
      }

      let inviteCodeId = oThis.inviteCodesByCode[inviteCode].id;

      let updateData = {
        inviter_code_id: inviterCodeId,
        invite_code_id: inviteCodeId
      };

      let promises = [];
      promises.push(
        new PreLaunchInviteModel()
          .update(updateData)
          .where({ invite_code: inviteCode })
          .fire()
      );

      promises.push(
        new InviteCodeModel()
          .update({ inviter_code_id: inviterCodeId })
          .where({ code: inviteCode })
          .fire()
      );

      await Promise.all(promises);
    }
  }
}

new InviteSeed({})
  .perform()
  .then(function(rsp) {
    process.exit(0);
  })
  .catch(function(err) {
    console.log(err);
    process.exit(1);
  });
