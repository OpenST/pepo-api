'use strict';
/**
 * @file - Model for ost_events table
 */
const rootPrefix = '../../..',
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  ModelBase = require(rootPrefix + '/app/models/mysql/Base'),
  ostEventConstants = require(rootPrefix + '/lib/globalConstant/ostEvent'),
  coreConstants = require(rootPrefix + '/config/coreConstants');

const dbName = 'pepo_api_' + coreConstants.environment;

class OstEventModel extends ModelBase {
  /**
   * ostEvent model
   *
   * @constructor
   */
  constructor() {
    super({ dbName: dbName });

    const oThis = this;

    oThis.tableName = 'ost_events';
  }

  /**
   *
   * @param dbRow
   * @return {object}
   */
  formatDbData(dbRow) {
    return {
      id: dbRow.id,
      eventId: dbRow.event_id,
      status: dbRow.status,
      eventData: dbRow.event_data,
      createdAt: dbRow.created_at,
      updatedAt: dbRow.updated_at
    };
  }
}

module.exports = OstEventModel;
