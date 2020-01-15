const rootPrefix = '../../..',
  ModelBase = require(rootPrefix + '/app/models/arango/Base'),
  videoArangoConstants = require(rootPrefix + '/lib/globalConstant/arango/video');

/**
 * Class for video model.
 *
 * @class VideoModel
 */
class VideoModel extends ModelBase {
  /**
   * Constructor for video model.
   *
   * @augments ModelBase
   *
   * @constructor
   */
  constructor() {
    super({});

    const oThis = this;

    oThis.collectionName = 'videos';
  }

  /**
   * Add a vertice In videos collection in arango db
   *
   * @param {object} insertParams
   * @param {string} insertParams.id
   * @param {number} insertParams.updatedAt
   *
   * @returns {Promise<*>}
   */
  async createEntry(insertParams) {
    const oThis = this;

    const query = 'INSERT {_key: @id, status: @status, updated_at: @updatedAt} INTO @@collectionName';
    const vars = {
      collectionName: oThis.collectionName,
      id: insertParams.id,
      status: videoArangoConstants.invertedStatuses[videoArangoConstants.activeStatus],
      updatedAt: insertParams.updatedAt
    };

    return oThis.query(query, vars);
  }

  /**
   * Add a vertice In videos collection in arango db
   *
   * @param {object} insertParams
   * @param {string} insertParams.id
   * @param {number} insertParams.updatedAt
   *
   * @returns {Promise<*>}
   */
  async updateTimestampForEntry(insertParams) {
    const oThis = this;

    const query = 'Update {_key: @id, updated_at: @updatedAt} INTO @@collectionName';
    const vars = {
      collectionName: oThis.collectionName,
      id: insertParams.id,
      updatedAt: insertParams.updatedAt
    };

    return oThis.query(query, vars);
  }

  /**
   * delete a vertice In videos collection in arango db alongwith its edges
   *
   * @param {object} params
   * @param {string} params.videoId
   *
   * @returns {Promise<*>}
   */
  async deleteEntryWithEdges(params) {
    const oThis = this;

    return oThis.onVertexConnection().remove(params.videoId);
  }

  /**
   * Format db data.
   *
   * @param {object} dbRow
   * @param {string} dbRow.id
   * @param {number} dbRow.status
   * @param {number} dbRow.updated_at
   *
   * @return {object}
   */
  formatDbData(dbRow) {
    const oThis = this;

    const formattedData = {
      id: dbRow.id,
      status: videoArangoConstants.statuses[dbRow.status],
      updatedAt: dbRow.updated_at
    };

    return oThis.sanitizeFormattedData(formattedData);
  }
}

module.exports = VideoModel;
