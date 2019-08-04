const rootPrefix = '../../../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  TokenUserDetailByUserIdCache = require(rootPrefix + '/lib/cacheManagement/multi/TokenUserByUserIds'),
  TokenUserByOstUserIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/TokenUserByOstUserIds'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

/**
 * Class for users related webhooks processors base.
 *
 * @class UserOstEventBase
 */
class UserOstEventBase extends ServiceBase {
  /**
   * Constructor for users related webhooks processors base.
   *
   * @param {object} params
   * @param {object} params.data
   * @param {object} params.data.user
   * @param {number} params.data.user.id
   * @param {string} params.data.user.token_holder_address
   * @param {string} params.data.user.status
   *
   * @augments ServiceBase
   *
   * @constructor
   */
  constructor(params) {
    super(params);

    const oThis = this;

    oThis.ostUser = params.data.user;

    oThis.ostUserId = oThis.ostUser.id;
    oThis.ostUserTokenHolderAddress = oThis.ostUser.token_holder_address;
    oThis.ostUserStatus = oThis.ostUser.status.toUpperCase();

    oThis.paramErrors = [];
  }

  /**
   * Validate and sanitize params.
   *
   * @return {Promise<void>}
   * @private
   */
  async _validateAndSanitizeParams() {
    const oThis = this;

    logger.log('Validate user params.');

    if (!CommonValidators.validateUuidV4(oThis.ostUserId)) {
      oThis.paramErrors.push('invalid_user_id');
    }

    return responseHelper.successWithData({});
  }

  /**
   * Fetch token user.
   *
   * @sets oThis.userId, oThis.tokenUserObj
   *
   * @return {Promise<void>}
   * @private
   */
  async _fetchTokenUser() {
    const oThis = this;

    logger.log('Fetching token user.');

    let tokenUserObjsRes = await new TokenUserByOstUserIdsCache({ ostUserIds: [oThis.ostUserId] }).fetch();

    if (tokenUserObjsRes.isFailure()) {
      return Promise.reject(tokenUserObjsRes);
    }

    const tokenUserObjRes = tokenUserObjsRes.data[oThis.ostUserId];

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

    if (tokenUserObjsRes.isFailure()) {
      return Promise.reject(tokenUserObjsRes);
    }

    oThis.tokenUserObj = tokenUserObjsRes.data[oThis.userId];

    if (!oThis.tokenUserObj.id) {
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 's_oe_u_b_ftu_2',
          api_error_identifier: 'something_went_wrong'
        })
      );
    }

    return responseHelper.successWithData({});
  }
}

module.exports = UserOstEventBase;
