const rootPrefix = '../../..',
  ModelBase = require(rootPrefix + '/app/models/mysql/Base'),
  coreConstants = require(rootPrefix + '/config/coreConstants'),
  userFeedConstants = require(rootPrefix + '/lib/globalConstant/userFeed');

const dbName = 'pepo_api_' + coreConstants.environment;

class UserFeedModel extends ModelBase {
  /**
   * UserFeed model
   *
   * @constructor
   */
  constructor() {
    super({ dbName: dbName });

    const oThis = this;

    oThis.tableName = 'user_feeds';
  }

  /**
   *
   * @param dbRow
   * @return {object}
   */
  formatDbData(dbRow) {
    return {
      id: dbRow.id,
      userId: dbRow.user_id,
      feedId: dbRow.feed_id,
      privacyType: userFeedConstants.privacyTypes[dbRow.privacy_type],
      publishedTs: dbRow.published_ts,
      createdAt: dbRow.created_at,
      updatedAt: dbRow.updated_at
    };
  }

  /**
   * Fetch feed ids for current user.
   *
   * @param {object} params
   * @param {array} params.userId
   * @param {number} [params.paginationTimestamp]
   * @param {number} [params.limit]
   *
   * @returns Promise<array>
   */
  async _currentUserFeedIds(params) {
    const oThis = this;

    const paginationTimestamp = params.paginationTimestamp,
      limit = params.limit || 10;

    const whereArray = ['user_id = ?', params.userId];

    if (paginationTimestamp) {
      whereArray[0] = whereArray[0] + ' AND published_ts < ?';
      whereArray.push(paginationTimestamp);
    }

    const feedIds = [];

    //todo: Published Ts and privacy type should be sent
    const dbRows = await oThis
      .select('feed_id')
      .where(whereArray)
      .order_by(
        'case when published_ts IS NULL then CURRENT_TIMESTAMP()\n' +
          '              else published_ts\n' +
          '         end desc'
      )
      .limit(limit)
      .fire();

    if (dbRows.length === 0) {
      return [];
    }

    for (let index = 0; index < dbRows.length; index++) {
      feedIds.push(dbRows[index].feed_id);
    }

    return feedIds;
  }

  /**
   * Fetch feed ids for other user.
   *
   * @param {object} params
   * @param {array} params.userId
   * @param {number} [params.paginationTimestamp]
   * @param {number} [params.limit]
   *
   * @returns Promise<array>
   */
  async _otherUserFeedIds(params) {
    const oThis = this;

    const paginationTimestamp = params.paginationTimestamp,
      limit = params.limit || 10;

    const whereArray = [
      'user_id = ? AND privacy_type = ? AND published_ts > 0',
      params.userId,
      userFeedConstants.invertedPrivacyTypes[userFeedConstants.publicPrivacyType]
    ];

    if (paginationTimestamp) {
      whereArray[0] = whereArray[0] + ' AND published_ts < ?';
      whereArray.push(paginationTimestamp);
    }

    const feedIds = [];

    const dbRows = await oThis
      .select('feed_id')
      .where(whereArray)
      .limit(limit)
      .order_by('published_ts desc')
      .fire();

    if (dbRows.length === 0) {
      return [];
    }

    for (let index = 0; index < dbRows.length; index++) {
      feedIds.push(dbRows[index].feed_id);
    }

    return feedIds;
  }

  /***
   * Fetch user feed by feed id
   *
   * @param userId {Integer} - id
   *
   * @return {Object}
   */
  async fetchByUserId(userId) {
    const oThis = this;
    let dbRows = await oThis
      .select('*')
      .where({ user_id: userId })
      .fire();

    if (dbRows.length === 0) {
      return {};
    }
    return oThis.formatDbData(dbRows[0]);
  }

  /***
   * Fetch user feed by feed id
   *
   * @param feedId {Integer} - feedId
   *
   * @return {Object}
   */
  async fetchByFeedId(feedId) {
    const oThis = this;
    let dbRows = await oThis
      .select('*')
      .where({ feed_id: feedId })
      .fire();

    if (dbRows.length === 0) {
      return {};
    }
    return oThis.formatDbData(dbRows[0]);
  }

  /***
   * Fetch user feeds for given ids
   *
   * @param Ids {Array} - Feed Ids
   *
   * @return {Object}
   */
  async fetchByIds(Ids) {
    const oThis = this;
    let response = {};

    let dbRows = await oThis
      .select('*')
      .where(['id IN (?)', Ids])
      .fire();

    for (let index = 0; index < dbRows.length; index++) {
      let formatDbRow = oThis.formatDbData(dbRows[index]);
      response[formatDbRow.id] = formatDbRow;
    }

    return response;
  }

  /***
   * Fetch user feed by id
   *
   * @param id {Integer} - id
   *
   * @return {Object}
   */
  async fetchById(id) {
    const oThis = this;
    let dbRows = await oThis.fetchByIds([id]);

    return dbRows[id] || {};
  }
}

module.exports = UserFeedModel;
