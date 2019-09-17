const rootPrefix = '../../../..',
  ModelBase = require(rootPrefix + '/app/models/mysql/Base'),
  redemptionConstants = require(rootPrefix + '/lib/globalConstant/admin'),
  databaseConstants = require(rootPrefix + '/lib/globalConstant/database');

// Declare variables names.
const dbName = databaseConstants.redemptionDbName;

/**
 * Class for redemption product model.
 *
 * @class RedemptionProductModel
 */
class RedemptionProductModel extends ModelBase {
  /**
   * Constructor for redemption product model.
   *
   * @augments ModelBase
   *
   * @constructor
   */
  constructor() {
    super({ dbName: dbName });

    const oThis = this;

    oThis.tableName = 'products';
  }

  formatDbData(dbRow) {
    const oThis = this;

    const formattedData = {
      id: dbRow.id,
      status: redemptionConstants.statuses[dbRow.status],
      kind: dbRow.kind,
      images: JSON.parse(dbRow.images),
      dollarValue: dbRow.dollar_value,
      createdAt: dbRow.created_at,
      updatedAt: dbRow.updated_at
    };

    return oThis.sanitizeFormattedData(formattedData);
  }

  /**
   * Get all products
   *
   * @return {Promise<Array>}
   */
  async getAll() {
    const oThis = this;

    const dbRows = await oThis.select('*').fire();

    const response = [];

    for (let index = 0; index < dbRows.length; index++) {
      const formatDbRow = oThis.formatDbData(dbRows[index]);
      response.push(formatDbRow);
    }

    return response;
  }
}

module.exports = RedemptionProductModel;
