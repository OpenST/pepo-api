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
   * @param {Boolean} params.isContributor
   * @param {Boolean} params.isTwitterFollower
   * @param {string} params.fromUserId
   * @param {number} params.toUserId
   *
   * @returns {Promise<*>}
   */
  async addUpdateIsFeedFollower(params) {
    const oThis = this;

    let updateKey = null;
    if (params.isTwitterFollower) {
      updateKey = 'is_twitter_follower';
    } else if (params.isContributor) {
      updateKey = 'is_contributor';
    } else {
      throw `INVALID Arguments Passed-${JSON.stringify(params)}`;
    }

    // || false is added for update in is_feed_follower to convert null to false.
    const query =
      'FOR u in @@collectionName ' +
      'FILTER u._from == @from and u._to == @to ' +
      'UPSERT  {_from: @from, _to:@to} ' +
      `INSERT {_from:@from, _to:@to, @updateKey: true, is_feed_follower: true} ` +
      `UPDATE {@updateKey: true, is_feed_follower: !(u.is_muted || u.is_blocked || false)} INTO @@collectionName`;

    const vars = {
      collectionName: oThis.collectionName,
      from: `${oThis.fromCollectionName}/${params.fromUserId}`,
      to: `${oThis.toCollectionName}/${params.toUserId}`,
      updateKey: updateKey
    };

    return oThis.query(query, vars);
  }

  /**
   * Add a edge In follows collection in arango db for isContributor or Is TwitterFollower
   *
   * @param {object} params
   * @param {Boolean} params.isMuted
   * @param {Boolean} params.isBlocked
   * @param {string} params.fromUserId
   * @param {number} params.toUserId
   *
   * @returns {Promise<*>}
   */
  async addUpdateIsNotFeedFollower(params) {
    const oThis = this;

    let updateKey = null;
    if (params.isMuted) {
      updateKey = 'is_muted';
    } else if (params.isBlocked) {
      updateKey = 'is_blocked';
    } else {
      throw `INVALID Arguments Passed-${JSON.stringify(params)}`;
    }

    // || false is added for update in is_feed_follower to convert null to false.
    const query =
      'FOR u in @@collectionName ' +
      'FILTER u._from == @from and u._to == @to ' +
      'UPSERT  {_from: @from, _to:@to} ' +
      `INSERT {_from:@from, _to:@to, @updateKey: true, is_feed_follower: false} ` +
      `UPDATE {@updateKey: true, is_feed_follower: (u.is_twitter_follower || u.is_contributor || false)} INTO @@collectionName`;

    const vars = {
      collectionName: oThis.collectionName,
      from: `${oThis.fromCollectionName}/${params.fromUserId}`,
      to: `${oThis.toCollectionName}/${params.toUserId}`,
      updateKey: updateKey
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
