const rootPrefix = '../../..',
  ModelBase = require(rootPrefix + '/app/models/arango/Base'),
  userArangoConstants = require(rootPrefix + '/lib/globalConstant/arango/user');

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
   * Add a vertice In users collection in arango db
   *
   * @param {object} insertParams
   * @param {string} insertParams.id
   * @param {number} insertParams.status
   * @param {number} insertParams.createdAt
   *
   * @returns {Promise<*>}
   */
  async createEntry(insertParams) {
    const oThis = this;

    const query = 'INSERT {_key: @id, status: @status, created_at: @createdAt} INTO @@collectionName';
    const vars = {
      collectionName: oThis.collectionName,
      id: insertParams.id,
      status: userArangoConstants.invertedStatuses[userArangoConstants.activeStatus],
      createdAt: insertParams.createdAt
    };

    return oThis.query(query, vars);
  }

  /**
   * delete a vertice In users collection in arango db alongwith its edges
   *
   * @param {object} params
   * @param {string} params.userId
   *
   * @returns {Promise<*>}
   */
  async deleteEntryWithEdges(params) {
    const oThis = this;

    return oThis.onVertexConnection().remove(params.userId);
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
      status: userArangoConstants.statuses[dbRow.status],
      createdAt: dbRow.created_at
    };

    return oThis.sanitizeFormattedData(formattedData);
  }
}

module.exports = UserModel;
