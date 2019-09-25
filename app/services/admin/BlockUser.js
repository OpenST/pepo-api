const rootPrefix = '../../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  UserModel = require(rootPrefix + '/app/models/mysql/User'),
  UsersCache = require(rootPrefix + '/lib/cacheManagement/multi/User'),
  AdminActivityLogModel = require(rootPrefix + '/app/models/mysql/AdminActivityLog'),
  RemoveContactInPepoCampaign = require(rootPrefix + '/lib/email/hookCreator/RemoveContact'),
  UserDeviceIdsByUserIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/UserDeviceIdsByUserIds'),
  TwitterDisconnect = require(rootPrefix + '/app/services/twitter/Disconnect'),
  bgJob = require(rootPrefix + '/lib/rabbitMqEnqueue/bgJob'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  userConstants = require(rootPrefix + '/lib/globalConstant/user'),
  bgJobConstants = require(rootPrefix + '/lib/globalConstant/bgJob'),
  adminActivityLogConstants = require(rootPrefix + '/lib/globalConstant/adminActivityLogs'),
  emailServiceApiCallHookConstants = require(rootPrefix + '/lib/globalConstant/emailServiceApiCallHook');

/**
 * Class to block users by admin.
 *
 * @class BlockUser
 */
class BlockUser extends ServiceBase {
  /**
   * Constructor to block users by admin.
   *
   * @param {object} params
   * @param {array} params.user_ids: User ids to be blocked by admin.
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

    oThis.userIdsLength = oThis.userIds.length;

    oThis.userObjects = {};
    oThis.userIdToVideoIds = {};
    oThis.videoIdsToBeDeleted = [];
  }

  /**
   * Async perform.
   *
   * @returns {Promise<*|result>}
   * @private
   */
  async _asyncPerform() {
    const oThis = this;

    if (oThis.userIdsLength === 0) {
      return responseHelper.successWithData({});
    }

    await oThis._fetchUsers();

    await oThis._blockUsers();

    await oThis._removeContactsInCampaigns();

    await oThis._fetchDeviceIds();

    await oThis._disconnectTwitter();

    const promisesArray = [];
    promisesArray.push(oThis._flushCache(), oThis._enqueueToBackgroundJob(), oThis._logAdminActivity());
    await Promise.all(promisesArray);

    return responseHelper.successWithData({});
  }

  /**
   * Fetch users.
   *
   * @sets oThis.userObjects
   *
   * @returns {Promise<*>}
   * @private
   */
  async _fetchUsers() {
    const oThis = this;

    const cacheRsp = await new UsersCache({ ids: oThis.userIds }).fetch();
    if (cacheRsp.isFailure()) {
      return Promise.reject(
        responseHelper.paramValidationError({
          internal_error_identifier: 'a_s_a_du_1',
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
            internal_error_identifier: 'a_s_a_du_2',
            api_error_identifier: 'could_not_proceed',
            params_error_identifiers: ['user_inactive'],
            debug_options: {}
          })
        );
      }

      oThis.userObjects[userId] = userObj;
    }
  }

  /**
   * Block users.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _blockUsers() {
    const oThis = this;

    return new UserModel()
      .update({ status: userConstants.invertedStatuses[userConstants.inActiveStatus] })
      .where({ id: oThis.userIds })
      .fire();
  }

  /**
   * Remove contacts from campaigns list
   *
   * @returns {Promise<void>}
   * @private
   */
  async _removeContactsInCampaigns() {
    const oThis = this;

    let promiseArray = [];

    for (let ind = 0; ind < oThis.userIds.length; ind++) {
      let userId = oThis.userIds[ind];

      let removeContactParams = {
        receiverEntityId: userId,
        receiverEntityKind: emailServiceApiCallHookConstants.userEmailEntityKind,
        customDescription: 'Remove contact after block user.'
      };

      let removeContactObj = new RemoveContactInPepoCampaign(removeContactParams);

      promiseArray.push(removeContactObj.perform());
    }

    await Promise.all(promiseArray);
  }

  /**
   * Fetch device ids
   *
   * @returns {Promise<never>}
   * @private
   */
  async _fetchDeviceIds() {
    const oThis = this;

    const userDeviceCacheRsp = await new UserDeviceIdsByUserIdsCache({ userIds: oThis.userIds }).fetch();

    if (userDeviceCacheRsp.isFailure()) {
      return Promise.reject(userDeviceCacheRsp);
    }

    oThis.deviceIdsMap = userDeviceCacheRsp.data;
  }

  /**
   * Disconnect twitter for users
   *
   * @returns {Promise<void>}
   * @private
   */
  async _disconnectTwitter() {
    const oThis = this;

    let promiseArray = [];

    for (let ind = 0; ind < oThis.userIds.length; ind++) {
      let userId = oThis.userIds[ind],
        deviceIds = oThis.deviceIdsMap[userId];

      for (let ind2 = 0; ind2 < deviceIds.length; ind2++) {
        let twitterDisconnectObj = new TwitterDisconnect({
          current_user: oThis.userObjects[userId],
          device_id: deviceIds[ind2]
        });

        promiseArray.push(twitterDisconnectObj.perform());
      }
    }

    await Promise.all(promiseArray);
  }

  /**
   * Flush all users cache.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _flushCache() {
    const oThis = this;

    const promisesArray = [];

    for (const userId in oThis.userObjects) {
      promisesArray.push(UserModel.flushCache(oThis.userObjects[userId]));
    }

    await Promise.all(promisesArray);
  }

  /**
   * Enqueue job to delete videos.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _enqueueToBackgroundJob() {
    const oThis = this;

    const promisesArray = [];

    for (let index = 0; index < oThis.userIdsLength; index++) {
      promisesArray.push(
        bgJob.enqueue(bgJobConstants.deleteUserVideosJobTopic, {
          userId: oThis.userIds[index],
          currentAdminId: oThis.currentAdminId
        })
      );
    }

    await Promise.all(promisesArray);
  }

  /**
   * Log admin activity.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _logAdminActivity() {
    const oThis = this;

    const promisesArray = [];

    for (let index = 0; index < oThis.userIdsLength; index++) {
      promisesArray.push(
        new AdminActivityLogModel().insertAction({
          adminId: oThis.currentAdminId,
          actionOn: oThis.userIds[index],
          action: adminActivityLogConstants.blockUser
        })
      );
    }

    await Promise.all(promisesArray);
  }
}

module.exports = BlockUser;
