const rootPrefix = '../../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  UserModel = require(rootPrefix + '/app/models/mysql/User'),
  TagModel = require(rootPrefix + '/app/models/mysql/Tag'),
  UsersCache = require(rootPrefix + '/lib/cacheManagement/multi/User'),
  CuratedEntityDeleteService = require(rootPrefix + '/app/services/admin/curated/Delete'),
  TwitterDisconnect = require(rootPrefix + '/app/services/disconnect/Twitter'),
  AdminActivityLogModel = require(rootPrefix + '/app/models/mysql/AdminActivityLog'),
  UserTagsCacheKlass = require(rootPrefix + '/lib/cacheManagement/multi/UserTagsByUserIds'),
  RemoveContactInPepoCampaign = require(rootPrefix + '/lib/email/hookCreator/RemoveContact'),
  bgJob = require(rootPrefix + '/lib/rabbitMqEnqueue/bgJob'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  userConstants = require(rootPrefix + '/lib/globalConstant/user'),
  bgJobConstants = require(rootPrefix + '/lib/globalConstant/bgJob'),
  userTagConstants = require(rootPrefix + '/lib/globalConstant/userTag'),
  curatedEntitiesConstants = require(rootPrefix + '/lib/globalConstant/curatedEntities'),
  adminActivityLogConstants = require(rootPrefix + '/lib/globalConstant/adminActivityLogs'),
  emailServiceApiCallHookConstants = require(rootPrefix + '/lib/globalConstant/emailServiceApiCallHook');

/**
 * Class to delete users by admin.
 *
 * @class DeleteUser
 */
class DeleteUser extends ServiceBase {
  /**
   * Constructor to delete users by admin.
   *
   * @param {object} params
   * @param {array} params.user_ids: User ids to be deleteed by admin.
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
    oThis.currentAdmin = params.current_admin;
    oThis.currentAdminId = params.current_admin.id;

    oThis.userIdsLength = oThis.userIds.length;

    oThis.userObjects = {};
    oThis.devicesMap = {};
    oThis.userDeviceIdsMap = {};
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

    await oThis._deleteUsers();

    const promisesArray = [
      oThis._deleteUserFromCuratedEntities(),
      oThis._decreseUserTagWeight(),
      oThis._removeContactsInCampaigns(),
      oThis._disconnectTwitter(),
      oThis._enqueueToBackgroundJob(),
      oThis._logAdminActivity()
    ];
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
   * Delete users.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _deleteUsers() {
    const oThis = this;

    await new UserModel()
      .update({ status: userConstants.invertedStatuses[userConstants.inActiveStatus] })
      .where({ id: oThis.userIds })
      .fire();

    return oThis._flushCache();
  }

  /**
   * Delete given users from curated entities.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _deleteUserFromCuratedEntities() {
    const oThis = this;

    for (let ind = 0; ind < oThis.userIds.length; ind++) {
      await new CuratedEntityDeleteService({
        current_admin: oThis.currentAdmin,
        entity_kind: curatedEntitiesConstants.userEntityKind,
        entity_id: oThis.userIds[ind]
      }).perform();
    }
  }

  /**
   * Decrease user tag weight.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _decreseUserTagWeight() {
    const oThis = this;

    const userTagCacheResp = await new UserTagsCacheKlass({ userIds: oThis.userIds }).fetch();

    for (const uId in userTagCacheResp.data) {
      const tagIds = userTagCacheResp.data[uId][userTagConstants.selfAddedKind] || [];

      if (tagIds && tagIds.length > 0) {
        await new TagModel().updateTagWeights(tagIds, -1);
        TagModel.flushCache({ ids: tagIds });
      }
    }
  }

  /**
   * Remove contacts from campaigns list.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _removeContactsInCampaigns() {
    const oThis = this;

    const promiseArray = [];

    //todo: do not add entry if no email

    const removeContactParams = {
      receiverEntityKind: emailServiceApiCallHookConstants.userEmailEntityKind,
      customDescription: 'Remove contact after delete user.'
    };

    for (let ind = 0; ind < oThis.userIds.length; ind++) {
      removeContactParams.receiverEntityId = oThis.userIds[ind];

      const removeContactObj = new RemoveContactInPepoCampaign(removeContactParams);

      promiseArray.push(removeContactObj.perform());
    }

    await Promise.all(promiseArray);
  }

  /**
   * Disconnect twitter for users.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _disconnectTwitter() {
    const oThis = this;

    const promiseArray = [];

    for (let ind = 0; ind < oThis.userIds.length; ind++) {
      const userId = oThis.userIds[ind];

      const twitterDisconnectObj = new TwitterDisconnect({
        current_user: oThis.userObjects[userId],
        device_id: null
      });

      promiseArray.push(twitterDisconnectObj.perform());
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
      const userId = oThis.userIds[index];

      promisesArray.push(
        bgJob.enqueue(bgJobConstants.deleteUserJobTopic, {
          userId: oThis.userIds[index],
          currentAdminId: oThis.currentAdminId
        })
      );
      promisesArray.push(
        bgJob.enqueue(bgJobConstants.deleteUserVideosJobTopic, {
          userId: userId,
          currentAdminId: oThis.currentAdminId,
          isUserCreator: UserModel.isUserApprovedCreator(oThis.userObjects[userId])
        })
      );
      promisesArray.push(
        bgJob.enqueue(bgJobConstants.deleteUserRepliesJobTopic, {
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
          action: adminActivityLogConstants.deleteUser
        })
      );
    }

    await Promise.all(promisesArray);
  }
}

module.exports = DeleteUser;
