'use strict';
/**
 * @file - Model for Feeds table
 */
const rootPrefix = '../../..',
  feedsConstants = require(rootPrefix + '/lib/globalConstant/feed'),
  ModelBase = require(rootPrefix + '/app/models/mysql/Base'),
  coreConstants = require(rootPrefix + '/config/coreConstants');

const dbName = 'pepo_api_' + coreConstants.environment;

class FeedModel extends ModelBase {
  /**
   * Feed model
   *
   * @constructor
   */
  constructor() {
    super({ dbName: dbName });

    const oThis = this;

    oThis.tableName = 'feeds';
  }

  /**
   *
   * @param dbRow
   * @return {object}
   */
  formatDbData(dbRow) {
    return {
      id: dbRow.id,
      kind: feedsConstants.kinds[dbRow.kind],
      primaryExternalEntityId: dbRow.primary_external_entity_id,
      extraData: dbRow.extra_data,
      status: feedsConstants.statuses[dbRow.status],
      publishedTs: dbRow.published_ts,
      createdAt: dbRow.created_at,
      updatedAt: dbRow.updated_at
    };
  }

  /***
   * Fetch feed by id
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
   * Fetch feed by externalEntityId
   *
   * @param externalEntityId {Integer} - externalEntityId
   *
   * @return {Object}
   */
  async fetchByPrimaryExternalEntityId(externalEntityId) {
    const oThis = this;
    let dbRows = await oThis
      .select('*')
      .where({ primary_external_entity_id: externalEntityId })
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

module.exports = FeedModel;
