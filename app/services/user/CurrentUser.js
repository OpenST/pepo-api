const rootPrefix = '../../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  SecureUserCache = require(rootPrefix + '/lib/cacheManagement/single/SecureUser'),
  TokenUserDetailByUserIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/TokenUserByUserIds'),
  UserModel = require(rootPrefix + '/app/models/mysql/User'),
  TokenUserModel = require(rootPrefix + '/app/models/mysql/TokenUser'),
  userConstants = require(rootPrefix + '/lib/globalConstant/user'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger');

class CurrentUser extends ServiceBase {
  /**
   * @param {Object} params
   * @param {String} params.current_user: User Name
   *
   * @constructor
   */
  constructor(params) {
    super(params);

    const oThis = this;

    oThis.userId = params.current_user.id;
  }

  /**
   * perform
   *
   * @return {Promise<void>}
   */
  async _asyncPerform() {
    const oThis = this;

    await oThis._fetchUser();

    await oThis._fetchTokenUser();

    return Promise.resolve(oThis._serviceResponse());
  }

  /**
   * Fetch Secure user
   *
   *
   * @return {Promise<void>}
   *
   * @private
   */
  async _fetchUser() {
    const oThis = this;
    logger.log('fetch User');

    let secureUserRes = await new SecureUserCache({ id: oThis.userId }).fetch();
    oThis.secureUser = secureUserRes.data;

    if (oThis.secureUser.status !== userConstants.activeStatus) {
      return Promise.reject(
        responseHelper.paramValidationError({
          internal_error_identifier: 's_um_l_fu_1',
          api_error_identifier: 'invalid_api_params',
          params_error_identifiers: ['invalid_user_name'],
          debug_options: {}
        })
      );
    }

    return Promise.resolve(responseHelper.successWithData({}));
  }

  /**
   * Fetch Token user
   *
   *
   * @return {Promise<void>}
   *
   * @private
   */
  async _fetchTokenUser() {
    const oThis = this;

    logger.log('fetch Token User');

    let tokenUserRes = await new TokenUserDetailByUserIdsCache({ userIds: [oThis.userId] }).fetch();
    oThis.tokenUser = tokenUserRes.data[oThis.userId];

    return Promise.resolve(responseHelper.successWithData({}));
  }

  /**
   * Response for service
   *
   *
   * @return {Promise<void>}
   *
   * @private
   */
  async _serviceResponse() {
    const oThis = this;

    let userLoginCookieValue = new UserModel().getCookieValueFor(oThis.secureUser, {
      timestamp: Date.now() / 1000
    });

    return responseHelper.successWithData({
      user: new UserModel().safeFormattedData(oThis.secureUser),
      tokenUser: new TokenUserModel().safeFormattedData(oThis.tokenUser),
      userLoginCookieValue: userLoginCookieValue
    });
  }
}

module.exports = CurrentUser;
