const rootPrefix = '../../..',
  ModelBase = require(rootPrefix + '/app/models/mysql/Base'),
  databaseConstants = require(rootPrefix + '/lib/globalConstant/database'),
  userUtmDetailsConstants = require(rootPrefix + '/lib/globalConstant/userUtmDetail');

// Declare variables.
const dbName = databaseConstants.userDbName;

/**
 * Class for user utm detail model.
 *
 * @class UserUtmDetail
 */
class UserUtmDetail extends ModelBase {
  /**
   * Constructor for user utm detail model.
   *
   * @augments ModelBase
   *
   * @constructor
   */
  constructor() {
    super({ dbName: dbName });

    const oThis = this;

    oThis.tableName = 'user_utm_details';
  }

  /**
   * Format Db data.
   *
   * @param {object} dbRow
   * @param {number} dbRow.id
   * @param {number} dbRow.user_id
   * @param {number} dbRow.kind
   * @param {string} dbRow.utm_campaign
   * @param {string} dbRow.utm_medium
   * @param {string} dbRow.utm_source
   * @param {number} dbRow.created_at
   * @param {number} dbRow.updated_at
   *
   * @return {object}
   */
  formatDbData(dbRow) {
    const oThis = this;

    const formattedData = {
      id: dbRow.id,
      userId: dbRow.user_id,
      kind: userUtmDetailsConstants.kinds[dbRow.kind],
      utmCampaign: dbRow.utm_campaign,
      utmMedium: dbRow.utm_medium,
      utmSource: dbRow.utm_source,
      createdAt: dbRow.created_at,
      updatedAt: dbRow.updated_at
    };

    return oThis.sanitizeFormattedData(formattedData);
  }

  /**
   * List of formatted column names that can be exposed by service.
   *
   * @returns {array}
   */
  safeFormattedColumnNames() {
    return ['id', 'userId', 'kind', 'utmCampaign', 'utmMedium', 'utmSource', 'createdAt', 'updatedAt'];
  }

  /**
   * Insert user utm details.
   *
   * @param {object} params
   * @param {number} params.userId
   * @param {number} params.kind
   * @param {string} params.utmCampaign
   * @param {string} params.utmMedium
   * @param {string} params.utmSource
   *
   * @returns {Promise<void>}
   */
  async insertUserUtmDetails(params) {
    const oThis = this;

    return oThis
      .insert({
        user_id: params.userId,
        kind: userUtmDetailsConstants.invertedKinds[params.kind],
        utm_campaign: params.utmCampaign,
        utm_medium: params.utmMedium,
        utm_source: params.utmSource
      })
      .fire();
  }
}

module.exports = UserUtmDetail;
