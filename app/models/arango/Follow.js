const rootPrefix = '../../..',
  ModelBase = require(rootPrefix + '/app/models/arango/Base'),
  UserArangoModel = require(rootPrefix + '/app/models/arango/User'),
  followConstants = require(rootPrefix + '/lib/globalConstant/arango/follow');

/**
 * Class for follow model.
 *
 * @class FollowModel
 */
class FollowModel extends ModelBase {
  /**
   * Constructor for follow model.
   *
   * @augments ModelBase
   *
   * @constructor
   */
  constructor() {
    super({});

    const oThis = this;

    oThis.collectionName = 'follows';
    oThis.fromCollectionName = new UserArangoModel().collectionName;
    oThis.toCollectionName = new UserArangoModel().collectionName;
  }

  /**
   * Add a edge In follows collection in arango db for isContributor or Is TwitterFollower
   *
   * @param {object} params
   * @param {Boolean} params.updateKey
   * @param {Boolean} params.updateVal
   * @param {string} params.fromUserId
   * @param {number} params.toUserId
   *
   * @returns {Promise<*>}
   */
  async addUpdateFollower(params) {
    const oThis = this;

    let updateKey = null,
      updateVal = params.updateVal ? true : false;

    let isFeedFollowerLogicForUpdate = null,
      isFeedFollowerLogicForInsert = null;

    if (params.updateKey == 'isTwitterFollower') {
      updateKey = 'is_twitter_follower';
      isFeedFollowerLogicForInsert = updateVal ? true : false;
      isFeedFollowerLogicForUpdate = updateVal
        ? '((!u.is_muted && !u.is_blocked) || true)'
        : '((u.is_contributor && !u.is_muted && !u.is_blocked) || false)';
    } else if (params.updateKey == 'isContributor') {
      updateKey = 'is_contributor';
      isFeedFollowerLogicForInsert = updateVal ? true : false;
      isFeedFollowerLogicForUpdate = updateVal
        ? '((!u.is_muted && !u.is_blocked) || true)'
        : '((u.is_twitter_follower && !u.is_muted && !u.is_blocked) || false)';
    } else if (params.updateKey == 'isMuted') {
      updateKey = 'is_muted';
      isFeedFollowerLogicForInsert = false;
      isFeedFollowerLogicForUpdate = updateVal
        ? 'false'
        : '(((u.is_twitter_follower || u.is_contributor) && !u.is_blocked) || false)';
    } else if (params.updateKey == 'isBlocked') {
      updateKey = 'is_blocked';
      isFeedFollowerLogicForInsert = false;
      isFeedFollowerLogicForUpdate = updateVal
        ? 'false'
        : '(((u.is_twitter_follower || u.is_contributor) && !u.is_muted) || false)';
    } else {
      throw `INVALID Arguments Passed-${JSON.stringify(params)}`;
    }

    const query =
      'FOR u in @@collectionName ' +
      'FILTER u._from == @from and u._to == @to ' +
      'UPSERT  {_from: @from, _to:@to} ' +
      `INSERT {_from:@from, _to:@to, @updateKey: @updateVal, is_feed_follower: ${isFeedFollowerLogicForInsert}} ` +
      `UPDATE {@updateKey: @updateVal, is_feed_follower: ${isFeedFollowerLogicForUpdate} INTO @@collectionName`;

    const vars = {
      collectionName: oThis.collectionName,
      from: `${oThis.fromCollectionName}/${params.fromUserId}`,
      to: `${oThis.toCollectionName}/${params.toUserId}`,
      updateKey: updateKey,
      updateVal: updateVal
    };

    return oThis.query(query, vars);
  }

  /**
   * Format db data.
   *
   * @param {object} dbRow
   * @param {string} dbRow.id
   * @param {string} dbRow._from
   * @param {string} dbRow._to
   * @param {number} dbRow.is_contributor
   * @param {number} dbRow.is_twitter_follower
   * @param {number} dbRow.is_muted
   * @param {number} dbRow.is_blocked
   * @param {number} dbRow.is_feed_follower
   *
   * @return {object}
   */
  formatDbData(dbRow) {
    const oThis = this;

    const formattedData = {
      id: dbRow.id,
      fromUserId: dbRow._from ? dbRow._from.split('/')[1] : undefined,
      toUserId: dbRow._from ? dbRow._to.split('/')[1] : undefined,
      isContributor: dbRow.is_contributor,
      isTwitterFollower: dbRow.is_twitter_follower,
      isMuted: dbRow.is_muted,
      isBlocked: dbRow.is_blocked,
      isFeedFollower: dbRow.is_feed_follower
    };

    return oThis.sanitizeFormattedData(formattedData);
  }
}

module.exports = FollowModel;
