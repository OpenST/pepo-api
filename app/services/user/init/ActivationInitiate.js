const rootPrefix = '../../../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  TokenUserDetailByUserIdCache = require(rootPrefix + '/lib/cacheManagement/multi/TokenUserByUserIds'),
  TokenUserModel = require(rootPrefix + '/app/models/mysql/TokenUser'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  CurrentUser = require(rootPrefix + '/app/services/user/init/GetCurrent'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  tokenUserConstants = require(rootPrefix + '/lib/globalConstant/tokenUser');

class ActivationInitiate extends ServiceBase {
  /**
   * Constructor for Activation Initiate
   *
   * @param {String} params.current_user.id: Current user id
   *
   * @constructor
   */
  constructor(params) {
    super(params);

    const oThis = this;
    oThis.currentUser = params.current_user;
    oThis.userId = params.current_user.id;

    oThis.tokenUserObj = {};
    oThis.serviceResponse = {};
  }

  /**
   * Async Perform
   *
   * @returns {Promise<void>}
   * @private
   */
  async _asyncPerform() {
    const oThis = this;

    await oThis._fetchTokenUserData();

    await oThis._updateTokenUser();

    await oThis._fetchCurrentUser();

    return responseHelper.successWithData(oThis.serviceResponse);
  }

  /**
   * Function to fetch token user data.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _fetchTokenUserData() {
    const oThis = this;

    let tokenUserObjsRes = await new TokenUserDetailByUserIdCache({ userIds: [oThis.userId] }).fetch();

    if (tokenUserObjsRes.isFailure()) {
      return Promise.reject(tokenUserObjsRes);
    }

    oThis.tokenUserObj = tokenUserObjsRes.data[oThis.userId];

    if (!oThis.tokenUserObj.id) {
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 's_u_i_ai_ftud_1',
          api_error_identifier: 'something_went_wrong'
        })
      );
    }

    return responseHelper.successWithData({});
  }

  /**
   * Update token user properties.
   *
   * @return {Promise<void>}
   * @private
   */
  async _updateTokenUser() {
    const oThis = this;

    logger.log('Updating token user to user activating.');

    if (
      oThis.tokenUserObj.ostStatus === tokenUserConstants.activatingOstStatus ||
      oThis.tokenUserObj.ostStatus === tokenUserConstants.activatedOstStatus
    ) {
      return responseHelper.successWithData({});
    }

    await new TokenUserModel()
      .update({
        ost_status: tokenUserConstants.invertedOstStatuses[tokenUserConstants.activatingOstStatus]
      })
      .where({ id: oThis.tokenUserObj.id })
      .fire();

    await TokenUserModel.flushCache({ userId: oThis.tokenUserObj.userId });

    return responseHelper.successWithData({});
  }

  /**
   * Fetch current user
   *
   * @sets oThis.currentUser
   *
   * @return {Promise<Result>}
   * @private
   */
  async _fetchCurrentUser() {
    const oThis = this;

    let currentUser = new CurrentUser({ current_user: oThis.currentUser });

    let currentUserRsp = await currentUser.perform();

    if (currentUserRsp.isFailure()) {
      return Promise.reject(currentUserRsp);
    }

    let currentUserData = currentUserRsp.data;

    Object.assign(oThis.serviceResponse, currentUserData);
  }
}

module.exports = ActivationInitiate;
