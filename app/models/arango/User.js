const rootPrefix = '../../..',
  ModelBase = require(rootPrefix + '/app/models/arango/Base'),
  util = require(rootPrefix + '/lib/util'),
  userConstants = require(rootPrefix + '/lib/globalConstant/aragon/user');

/**
 * Class for user model.
 *
 * @class UserModel
 */
class UserModel extends ModelBase {
  /**
   * Constructor for user model.
   *
   * @augments ModelBase
   *
   * @constructor
   */
  constructor() {
    super({});

    const oThis = this;

    oThis.collectionName = 'users';
  }

  /**
   * Format db data.
   *
   * @param {object} dbRow
   * @param {string} dbRow.id
   * @param {number} dbRow.status
   * @param {number} dbRow.created_at
   *
   * @return {object}
   */
  formatDbData(dbRow) {
    const oThis = this;

    const formattedData = {
      id: dbRow.id,
      status: userConstants.statuses[dbRow.status],
      createdAt: dbRow.created_at
    };

    return oThis.sanitizeFormattedData(formattedData);
  }
}

module.exports = UserModel;
