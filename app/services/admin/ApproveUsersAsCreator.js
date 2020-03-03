const rootPrefix = '../../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  UserModel = require(rootPrefix + '/app/models/mysql/User'),
  UsersCache = require(rootPrefix + '/lib/cacheManagement/multi/User'),
  bgJob = require(rootPrefix + '/lib/rabbitMqEnqueue/bgJob'),
  pixelJob = require(rootPrefix + '/lib/rabbitMqEnqueue/pixel'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  userConstants = require(rootPrefix + '/lib/globalConstant/user'),
  bgJobConstants = require(rootPrefix + '/lib/globalConstant/bgJob'),
  pixelConstants = require(rootPrefix + '/lib/globalConstant/pixel'),
  pixelJobConstants = require(rootPrefix + '/lib/globalConstant/pixelJob');

/**
 * Class to approve users by admin.
 *
 * @class ApproveUsersAsCreator
 */
class ApproveUsersAsCreator extends ServiceBase {
  /**
   * Constructor to approve users by admin.
   *
   * @param {object} params
   * @param {array} params.user_ids: User ids to be approved by admin.
   * @param {object} params.current_admin: current admin.
   *
   * @augments ServiceBase
   *
   * @constructor
   */
  constructor(params) {
    super();

    const oThis = this;

    oThis.userIds = params.user_ids;
    oThis.currentAdminId = params.current_admin.id;

    oThis.userObjects = {};
  }

  /**
   * Async perform.
   *
   * @returns {Promise<result>}
   * @private
   */
  async _asyncPerform() {
    const oThis = this;

    await oThis._fetchUsers();

    await oThis._approveUsers();

    for (let index = 0; index < oThis.userIds.length; index++) {
      const userId = oThis.userIds[index];
      await UserModel.flushCache(oThis.userObjects[userId]);
      const promisesArray = [
        bgJob.enqueue(bgJobConstants.postUserApprovalJob, { userId: userId, currentAdminId: oThis.currentAdminId })
      ];
      await Promise.all(promisesArray);
    }

    return responseHelper.successWithData({});
  }

  /**
   * Fetch users.
   *
   * @sets oThis.userObjects
   *
   * @returns {Promise<never>}
   * @private
   */
  async _fetchUsers() {
    const oThis = this;

    const cacheRsp = await new UsersCache({ ids: oThis.userIds }).fetch();

    if (cacheRsp.isFailure()) {
      return Promise.reject(
        responseHelper.paramValidationError({
          internal_error_identifier: 'a_s_a_au_1',
          api_error_identifier: 'invalid_params',
          params_error_identifiers: ['invalid_user_id'],
          debug_options: {}
        })
      );
    }

    for (const userId in cacheRsp.data) {
      const userObj = cacheRsp.data[userId];

      if (userObj.status !== userConstants.activeStatus) {
        return Promise.reject(
          responseHelper.paramValidationError({
            internal_error_identifier: 'a_s_a_au_2',
            api_error_identifier: 'could_not_proceed',
            params_error_identifiers: ['user_inactive'],
            debug_options: {}
          })
        );
      }

      if (UserModel.isUserApprovedCreator(userObj)) {
        return Promise.reject(
          responseHelper.paramValidationError({
            internal_error_identifier: 'a_s_a_au_3',
            api_error_identifier: 'could_not_proceed',
            params_error_identifiers: ['user_already_approved'],
            debug_options: {}
          })
        );
      }

      oThis.userObjects[userId] = userObj;
    }
  }

  /**
   * Approve users.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _approveUsers() {
    const oThis = this;

    const propertyVal = userConstants.invertedProperties[userConstants.isApprovedCreatorProperty];

    await new UserModel()
      .update(['properties = properties | ?', propertyVal])
      .where({ id: oThis.userIds })
      .fire();
  }
}

module.exports = ApproveUsersAsCreator;
