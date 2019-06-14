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
   * @param {number} [params.page]
   * @param {number} [params.limit]
   *
   * @returns Promise<array>
   */
  async _currentUserFeedIds(params) {
    const oThis = this;

    const page = params.page || 1,
      limit = params.limit || 10,
      offset = (page - 1) * limit;

    const feedIds = [];

    const dbRows = await oThis
      .select('feed_id')
      .where({ user_id: params.userId })
      .limit(limit)
      .offset(offset)
      .order_by(
        'case when published_ts IS NULL then 3\n' +
          '              when published_ts > 0 then 2\n' +
          '              else 1\n' +
          '         end desc'
      )
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
   * @param {number} [params.page]
   * @param {number} [params.limit]
   *
   * @returns Promise<array>
   */
  async _otherUserFeedIds(params) {
    const oThis = this;

    const page = params.page || 1,
      limit = params.limit || 10,
      offset = (page - 1) * limit;

    const feedIds = [];

    const dbRows = await oThis
      .select('feed_id')
      .where([
        'user_id = ? AND privacy_type = ? AND published_ts > 0',
        params.userId,
        userFeedConstants.invertedPrivacyTypes[userFeedConstants.publicPrivacyType]
      ])
      .limit(limit)
      .offset(offset)
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

  /***
   * Flush cache
   *
   * @param {object} params
   * @param {Integer} params.id
   *
   * @returns {Promise<*>}
   */
  static async flushCache(params) {
    // TODO - feeds - remove this cache and its flush
    const UserFeedByIds = require(rootPrefix + '/lib/cacheManagement/multi/UserFeedByIds');

    await new UserFeedByIds({
      ids: [params.id]
    }).clear();
  }
}

module.exports = UserFeedModel;
