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

    let limit = 10,
      offset = 0;

    let preLaunchInviteRsp = await new PreLaunchInviteModel()
      .select('count(*) as count')
      .where(['id > (?)', oThis.preLaunchInviteId])
      .fire();
    let totalRecords = parseInt(preLaunchInviteRsp[0].count);

    while (offset < totalRecords) {
      await oThis._fetchPreLaunchInvites(limit, offset);

      await oThis.__seedInviteCodes();

      await oThis._fetchInviteCodes();

      await oThis._updatePreLaunchInvites();

      offset = offset + 10;
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

    let inviterCode = null;

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

      if (!CommonValidators.isVarNullOrUndefined(inviterUserId)) {
        if (CommonValidators.validateNonEmptyObject(oThis.preLaunchInvitesById[inviterUserId])) {
          let preLaunchInviteByIdObj = oThis.preLaunchInvitesById[inviterUserId],
            inviterCode = preLaunchInviteByIdObj.inviteCode;
        } else {
          let preLaunchInviteObj = await new PreLaunchInviteModel().fetchById(inviterUserId);
          inviterCode = preLaunchInviteObj.inviteCode;
          oThis.preLaunchInvitesById[preLaunchInviteObj.id] = preLaunchInviteObj;
        }
      }

      if (!CommonValidators.isVarNullOrUndefined(inviterCode)) {
        oThis.inviterInviteCodes.push(inviterCode);
      }
    }
  }

  /**
   * Seed invite codes from pre launch invites
   *
   * @returns {Promise<>}
   * @private
   */
  async __seedInviteCodes() {
    const oThis = this;

    let bulkInsertVal = [];

    for (let inviteCode in oThis.preLaunchInvitesByInviteCode) {
      let preLaunchInviteObj = oThis.preLaunchInvitesByInviteCode[inviteCode],
        inivteLimit = preLaunchInviteObj.creatorStatus === preLaunchInviteConstant.approvedCreatorStatus ? -1 : 50;

      bulkInsertVal.push([inviteCode, inivteLimit]);
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
  async _updatePreLaunchInvites() {
    const oThis = this;

    let preLaunchInviteByIdObj = {},
      inviterInviteCode = null;

    for (let inviteCode in oThis.preLaunchInvitesByInviteCode) {
      let inviterCodeId = null;
      let preLaunchInviteByInviteCodeObj = oThis.preLaunchInvitesByInviteCode[inviteCode];

      if (!CommonValidators.isVarNullOrUndefined(preLaunchInviteByInviteCodeObj.inviterUserId)) {
        if (
          CommonValidators.validateNonEmptyObject(
            oThis.preLaunchInvitesById[preLaunchInviteByInviteCodeObj.inviterUserId]
          )
        ) {
          preLaunchInviteByIdObj = oThis.preLaunchInvitesById[preLaunchInviteByInviteCodeObj.inviterUserId];
          inviterInviteCode = preLaunchInviteByIdObj.inviteCode;
          inviterCodeId = oThis.inviteCodesByCode[inviterInviteCode].id;
        }
      }

      let inviteCodeId = oThis.inviteCodesByCode[inviteCode].id;

      let updateData = {
        inviter_code_id: inviterCodeId,
        invite_code_id: inviteCodeId
      };

      await new PreLaunchInviteModel()
        .update(updateData)
        .where({ invite_code: inviteCode })
        .fire();
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
