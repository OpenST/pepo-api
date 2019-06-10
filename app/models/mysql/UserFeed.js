'use strict';
/**
 * @file - Model for User Feeds table
 */
const rootPrefix = '../../..',
  feedsConstants = require(rootPrefix + '/lib/globalConstant/feed'),
  ModelBase = require(rootPrefix + '/app/models/mysql/Base'),
  coreConstants = require(rootPrefix + '/config/coreConstants');

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
      publishedTs: dbRow.published_ts,
      createdAt: dbRow.created_at,
      updatedAt: dbRow.updated_at
    };
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
    let dbRows = await oThis
      .select('*')
      .where({ id: id })
      .fire();

    if (dbRows.length === 0) {
      return {};
    }
    return oThis.formatDbData(dbRows[0]);
  }

  /***
   * Fetch user feed by feed id
   *
   * @param id {Integer} - id
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
   * Flush cache
   *
   * @param {object} params
   *
   * @returns {Promise<*>}
   */
  static async flushCache(params) {
    let id = params.id;
    return null;
  }
}

module.exports = UserFeedModel;
