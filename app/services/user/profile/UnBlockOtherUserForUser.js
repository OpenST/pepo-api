const rootPrefix = '../../../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  UserRelationModel = require(rootPrefix + '/app/models/mysql/UserRelation'),
  userRelationConstants = require(rootPrefix + '/lib/globalConstant/userRelation'),
  UserBlockedListCache = require(rootPrefix + '/lib/cacheManagement/single/UserBlockedList'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

/**
 * Class to block user's profile for current user
 *
 */
class UnBlockOtherUserForUser extends ServiceBase {
  constructor(params) {
    super(params);

    const oThis = this;
    oThis.currentUserId = params.current_user.id;
    oThis.profileUserId = params.profile_user_id;
  }

  /**
   * Async perform
   *
   * @returns {Promise<void>}
   * @private
   */
  async _asyncPerform() {
    const oThis = this;

    await oThis._validateParams();

    await oThis._updateUserRelations();

    await oThis._flushCache();

    return responseHelper.successWithData({});
  }

  /**
   * Validate Params
   *
   * @returns {Promise<never>}
   * @private
   */
  async _validateParams() {
    const oThis = this;

    if (oThis.currentUserId == oThis.profileUserId) {
      return Promise.reject(
        responseHelper.paramValidationError({
          internal_error_identifier: 'a_s_u_p_ub_1',
          api_error_identifier: 'could_not_proceed',
          params_error_identifiers: ['self_profile_cannot_blocked'],
          debug_options: {}
        })
      );
    }

    await oThis._validateProfileUserId();
  }

  /**
   * Update user relations records
   *
   * @returns {Promise<void>}
   * @private
   */
  async _updateUserRelations() {
    const oThis = this;

    // Fetch user relations
    let userRelationsRows = await new UserRelationModel()
      .select('*')
      .where([
        '(user1_id = ? AND user2_id = ?) OR (user2_id = ? AND user1_id = ?)',
        oThis.currentUserId,
        oThis.profileUserId,
        oThis.currentUserId,
        oThis.profileUserId
      ])
      .fire();

    if (userRelationsRows.length < 2) {
      return Promise.reject(
        responseHelper.paramValidationError({
          internal_error_identifier: 'a_s_u_p_ub_2',
          api_error_identifier: 'could_not_proceed',
          params_error_identifiers: ['user_not_blocked'],
          debug_options: {}
        })
      );
    }

    for (let index = 0; index < userRelationsRows.length; index++) {
      let row = userRelationsRows[index];
      if (row.user1_id == oThis.currentUserId) {
        // If user 1 id is current user then set that relations
        await new UserRelationModel()
          .update([
            'relations = relations ^ ?',
            userRelationConstants.invertedRelations[userRelationConstants.blockedByUser1Relation]
          ])
          .where({ id: row.id })
          .fire();
      } else {
        await new UserRelationModel()
          .update([
            'relations = relations ^ ?',
            userRelationConstants.invertedRelations[userRelationConstants.blockedByUser2Relation]
          ])
          .where({ id: row.id })
          .fire();
      }
    }
  }

  /**
   * Flush cache for both users
   *
   * @returns {Promise<void>}
   * @private
   */
  async _flushCache() {
    const oThis = this;

    let promises = [];
    promises.push(new UserBlockedListCache({ userId: oThis.currentUserId }).clear());
    promises.push(new UserBlockedListCache({ userId: oThis.profileUserId }).clear());
    await Promise.all(promises);
  }
}

module.exports = UnBlockOtherUserForUser;
