const rootPrefix = '../../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  UserModel = require(rootPrefix + '/app/models/mysql/User'),
  UserUniqueIdentifierModel = require(rootPrefix + '/app/models/mysql/UserIdentifier'),
  UserIdByUserNamesCache = require(rootPrefix + '/lib/cacheManagement/multi/UserIdByUserNames'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

/**
 * Class to rotate account.
 *
 * @class RotateAccountBase
 */
class RotateAccountBase extends ServiceBase {
  /**
   * Constructor to rotate account.
   *
   * @param {object} params
   * @param {string} params.user_name: user name
   *
   * @augments ServiceBase
   *
   * @constructor
   */
  constructor(params) {
    super();

    const oThis = this;

    oThis.userName = params.user_name;

    oThis.userId = null;
  }

  /**
   * Async perform.
   *
   * @return {Promise<void>}
   */
  async _asyncPerform() {
    const oThis = this;

    await oThis._fetchUser();

    await oThis._fetchSocialUser();

    await oThis._rotateAccount();

    await oThis._deleteSocialUserExtended();

    await oThis._markUserEmailAsNull();

    await oThis._deleteUniqueUserIdentifier();

    return responseHelper.successWithData({});
  }

  /**
   * Fetch user.
   *
   * @sets oThis.userId
   *
   * @return {Promise<void>}
   * @private
   */
  async _fetchUser() {
    const oThis = this;

    const cacheRsp = await new UserIdByUserNamesCache({ userNames: [oThis.userName] }).fetch();
    if (cacheRsp.isFailure()) {
      return Promise.reject(cacheRsp);
    }

    if (!cacheRsp.data[oThis.userName].id) {
      return Promise.reject(
        responseHelper.paramValidationError({
          internal_error_identifier: 'a_s_r_b_1',
          api_error_identifier: 'invalid_api_params',
          params_error_identifiers: ['user_not_found'],
          debug_options: { userName: oThis.userName }
        })
      );
    }

    oThis.userId = cacheRsp.data[oThis.userName].id;
  }

  /**
   * Fetch social user.
   *
   * @private
   */
  async _fetchSocialUser() {
    throw new Error('Sub-class to implement.');
  }

  /**
   * Rotate account.
   *
   * @private
   */
  async _rotateAccount() {
    throw new Error('Sub-class to implement.');
  }

  /**
   * Delete social user extended.
   *
   * @private
   */
  async _deleteSocialUserExtended() {
    throw new Error('Sub-class to implement.');
  }

  /**
   * Mark user email as null.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _markUserEmailAsNull() {
    const oThis = this;

    await new UserModel()
      .update({ email: null })
      .where({ id: oThis.userId })
      .fire();

    await UserModel.flushCache({ id: oThis.userId });
  }

  /**
   * Delete user identifier.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _deleteUniqueUserIdentifier() {
    const oThis = this;

    //NOTE - we need email('eValue') for cache flush param
    const fetchByUserIdsRsp = await new UserUniqueIdentifierModel().fetchByUserIds([oThis.userId]),
      userIdentifiers = fetchByUserIdsRsp[oThis.userId];

    const emails = [];

    if (userIdentifiers) {
      for (let index = 0; index < userIdentifiers.length; index++) {
        emails.push(userIdentifiers[index].eValue);
      }

      await new UserUniqueIdentifierModel()
        .delete()
        .where({ user_id: oThis.userId })
        .fire();

      if (emails.length > 0) {
        await UserUniqueIdentifierModel.flushCache({ emails: emails });
      }
    }
  }
}

module.exports = RotateAccountBase;
