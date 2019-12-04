const rootPrefix = '../../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  UserMuteModel = require(rootPrefix + '/app/models/mysql/UserMute'),
  UsersCache = require(rootPrefix + '/lib/cacheManagement/multi/User'),
  UserMuteByUser1IdsCache = require(rootPrefix + '/lib/cacheManagement/multi/UserMuteByUser1Ids'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  userConstants = require(rootPrefix + '/lib/globalConstant/user');

/**
 * Class for user to user mute.
 *
 * @class UserMute
 */
class UserMute extends ServiceBase {
  /**
   * Constructor for user to user mute.
   *
   * @param {object} params
   * @param {object} params.current_user: User id to be mute by admin.
   * @param {object} params.user_id: User id to be muted.
   *
   * @augments ServiceBase
   *
   * @constructor
   */
  constructor(params) {
    super();

    const oThis = this;

    oThis.currentUserId = params.current_user.id;
    oThis.otherUserId = params.user_id;
  }

  /**
   * Async perform.
   *
   * @returns {Promise<*|result>}
   * @private
   */
  async _asyncPerform() {
    const oThis = this;

    await oThis._validate();

    await oThis._fetchUser();

    await oThis._fetchCurrentMuteState();

    await oThis._muteUser();

    return responseHelper.successWithData({});
  }

  /**
   * Validate params.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _validate() {
    const oThis = this;

    if (oThis.currentUserId === oThis.otherUserId) {
      return Promise.reject(
        responseHelper.paramValidationError({
          internal_error_identifier: 'a_s_a_m_1',
          api_error_identifier: 'invalid_api_params',
          params_error_identifiers: ['mute_not_possible'],
          debug_options: {
            currentUserId: oThis.currentUserId,
            otherUserId: oThis.otherUserId
          }
        })
      );
    }
  }

  /**
   * Fetch users.
   *
   * @returns {Promise<*>}
   * @private
   */
  async _fetchUser() {
    const oThis = this;

    const cacheRsp = await new UsersCache({ ids: [oThis.currentUserId, oThis.otherUserId] }).fetch();

    if (cacheRsp.isFailure()) {
      return Promise.reject(cacheRsp);
    }

    const currentUserObj = cacheRsp.data[oThis.currentUserId],
      otherUserObj = cacheRsp.data[oThis.otherUserId];

    if (currentUserObj.status !== userConstants.activeStatus || otherUserObj.status !== userConstants.activeStatus) {
      return Promise.reject(
        responseHelper.paramValidationError({
          internal_error_identifier: 'a_s_a_m_2',
          api_error_identifier: 'invalid_api_params',
          params_error_identifiers: ['user_inactive'],
          debug_options: {}
        })
      );
    }
  }

  /**
   * Fetch current mute state
   *
   * @returns {Promise<never>}
   * @private
   */
  async _fetchCurrentMuteState() {
    const oThis = this;

    const cacheResponse = await new UserMuteByUser1IdsCache({ user1Ids: [oThis.currentUserId] }).fetch();

    if (cacheResponse.isFailure()) {
      return Promise.reject(cacheResponse);
    }

    let cachedData = cacheResponse.data[oThis.userId];

    for (let muteUserId in cachedData) {
      if (muteUserId === oThis.otherUserId) {
        return Promise.reject(
          responseHelper.error({
            internal_error_identifier: 'a_s_a_mu_3',
            api_error_identifier: 'user_already_muted',
            debug_options: {}
          })
        );
      }
    }
  }

  /**
   * Mute user.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _muteUser() {
    const oThis = this;

    let insertData = {
      user1_id: oThis.currentUserId,
      user2_id: oThis.otherUserId
    };

    let insertResponse = await new UserMuteModel().insert(insertData).fire();

    if (!insertResponse) {
      logger.error('Error while inserting data in userMute table.');
      return Promise.reject(new Error('Error while inserting data in userMute table.'));
    }

    return UserMuteModel.flushCache({ user1Id: oThis.currentUserId });
  }
}

module.exports = UserMute;
