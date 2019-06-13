const rootPrefix = '../../../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  TokenUserByOstUserIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/TokenUserByOstUserIds'),
  TokenUserDetailByUserIdCache = require(rootPrefix + '/lib/cacheManagement/multi/TokenUserByUserIds'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

class UserOstEventBase extends ServiceBase {
  /**
   * @param params
   *
   */
  constructor(params) {
    super(params);

    const oThis = this;

    oThis.ostUser = params.data.user;

    oThis.ostUserid = oThis.ostUser.id;
    oThis.ostUserTokenHolderAddress = oThis.ostUser.token_holder_address.toLowerCase();
    oThis.ostUserStatus = oThis.ostUser.status.toUpperCase();
    oThis.paramErrors = [];
  }

  /**
   * Validate Request
   *
   *
   * @return {Promise<void>}
   *
   * @private
   */
  async _validateAndSanitizeParams() {
    const oThis = this;

    logger.log('Validate for user activation initiate status');

    if (!CommonValidators.validateEthAddress(oThis.ostUserTokenHolderAddress)) {
      oThis.paramErrors.push('invalid_token_holder_address');
    }

    return Promise.resolve(responseHelper.successWithData({}));
  }

  /**
   * Fetch token user
   *
   *
   * @return {Promise<void>}
   *
   * @private
   */
  async _fetchTokenUser() {
    const oThis = this;

    logger.log('Fetch Token User');

    let tokenUserObjsRes = await new TokenUserByOstUserIdsCache({ ostUserIds: [oThis.ostUserid] }).fetch();
    const tokenUserObjRes = tokenUserObjsRes.data[oThis.ostUserid];

    if (!tokenUserObjRes.userId) {
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 's_oe_u_b_ftu_1',
          api_error_identifier: 'resource_not_found'
        })
      );
    }

    oThis.userId = tokenUserObjRes.userId;

    tokenUserObjsRes = await new TokenUserDetailByUserIdCache({ userIds: [oThis.userId] }).fetch();
    oThis.tokenUserObj = tokenUserObjsRes.data[oThis.userId];

    if (!oThis.tokenUserObj.id) {
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 's_oe_u_b_ftu_2',
          api_error_identifier: 'something_went_wrong'
        })
      );
    }

    return Promise.resolve(responseHelper.successWithData({}));
  }
}

module.exports = UserOstEventBase;
