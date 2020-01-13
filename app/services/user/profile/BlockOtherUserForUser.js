const rootPrefix = '../../../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  FollowArangoModel = require(rootPrefix + '/app/models/arango/Follow'),
  UserRelationModel = require(rootPrefix + '/app/models/mysql/UserRelation'),
  userRelationConstants = require(rootPrefix + '/lib/globalConstant/userRelation'),
  UserBlockedListCache = require(rootPrefix + '/lib/cacheManagement/single/UserBlockedList'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

/**
 * Class to block user's profile for current user
 *
 */
class BlockOtherUserForUser extends ServiceBase {
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

    await oThis._updateGraphDb();

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
          internal_error_identifier: 'a_s_u_p_b_1',
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

    // Two entries would be created in user relations
    let insertArray = [];
    // First row would be user 1 blocked user 2
    insertArray.push([
      oThis.currentUserId,
      oThis.profileUserId,
      userRelationConstants.invertedRelations[userRelationConstants.blockedByUser1Relation]
    ]);
    // Second row would be user 1 was blocked by user 2
    insertArray.push([
      oThis.profileUserId,
      oThis.currentUserId,
      userRelationConstants.invertedRelations[userRelationConstants.blockedByUser2Relation]
    ]);
    await new UserRelationModel()
      .insertMultiple(['user1_id', 'user2_id', 'relations'], insertArray, { touch: true })
      .fire()
      .catch(async function(err) {
        if (UserRelationModel.isDuplicateIndexViolation(UserRelationModel.userRelationUniqueIndexName, err)) {
          // Fetch row from db
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
          for (let index = 0; index < userRelationsRows.length; index++) {
            let row = userRelationsRows[index];
            if (row.user1_id == oThis.currentUserId) {
              // If user 1 id is current user then set that relations
              await new UserRelationModel()
                .update([
                  'relations = relations | ?',
                  userRelationConstants.invertedRelations[userRelationConstants.blockedByUser1Relation]
                ])
                .where({ id: row.id })
                .fire();
            } else {
              await new UserRelationModel()
                .update([
                  'relations = relations | ?',
                  userRelationConstants.invertedRelations[userRelationConstants.blockedByUser2Relation]
                ])
                .where({ id: row.id })
                .fire();
            }
          }
        }
      });
  }

  /**
   * Update Follow Edge on graph db.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _updateGraphDb() {
    const oThis = this;
    const params = {
      updateKey: 'isBlocked',
      updateVal: true,
      fromUserId: oThis.currentUserId,
      toUserId: oThis.profileUserId
    };

    await new FollowArangoModel().addUpdateFollower(params);
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

module.exports = BlockOtherUserForUser;
