const rootPrefix = '../../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  PreLaunchInviteModel = require(rootPrefix + '/app/models/mysql/PreLaunchInvite'),
  InviteCodeByIdCache = require(rootPrefix + '/lib/cacheManagement/single/InviteCodeById'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

/**
 * Class for Pre Launch Invite get account info .
 *
 * @class PreLaunchAccount
 */
class PreLaunchAccount extends ServiceBase {
  /**
   * Constructor for Pre Launch Invite get account info service.
   *
   * @param {object} params
   *
   * @augments ServiceBase
   *
   * @constructor
   */
  constructor(params) {
    super(params);

    const oThis = this;
    oThis.securePreLaunchInviteObj = params.current_pre_launch_invite;

    oThis.preLaunchInviteDetails = null;
    oThis.inviteCodeDetails = null;
  }

  /**
   * Perform: Async .
   *
   * @return {Promise<void>}
   */
  async _asyncPerform() {
    const oThis = this;

    await oThis._fetchPreLaunchInviteDetails();

    await oThis._fetchInviteCodeDetails();

    return oThis._prepareResponse();
  }

  /**
   * Fetch pre launch invite details
   *
   * @sets oThis.preLaunchInviteDetails
   *
   * @returns {Promise<void>}
   * @private
   */
  async _fetchPreLaunchInviteDetails() {
    const oThis = this;

    const safeFormattedPreLaunchInviteData = new PreLaunchInviteModel().safeFormattedData(
      oThis.securePreLaunchInviteObj
    );

    oThis.preLaunchInviteDetails = safeFormattedPreLaunchInviteData;
  }

  /**
   * Fetch invite code details of current user.
   *
   * @sets oThis.inviteCodeDetails
   *
   * @returns {Promise<never>}
   * @private
   */
  async _fetchInviteCodeDetails() {
    const oThis = this;

    const inviteCodeByIdCacheResponse = await new InviteCodeByIdCache({
      id: oThis.preLaunchInviteDetails.inviteCodeId
    }).fetch();

    if (inviteCodeByIdCacheResponse.isFailure()) {
      return Promise.reject(inviteCodeByIdCacheResponse);
    }

    oThis.inviteCodeDetails = inviteCodeByIdCacheResponse.data;
  }

  /**
   * Prepare response
   *
   * @returns {Promise<any>}
   * @private
   */
  async _prepareResponse() {
    const oThis = this;

    let response = {
      preLaunchInvite: oThis.preLaunchInviteDetails,
      inviteCode: oThis.inviteCodeDetails
    };

    return Promise.resolve(responseHelper.successWithData(response));
  }
}

module.exports = PreLaunchAccount;
