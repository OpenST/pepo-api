const rootPrefix = '../../..',
  ModelBase = require(rootPrefix + '/app/models/mysql/Base'),
  databaseConstants = require(rootPrefix + '/lib/globalConstant/database');

// Declare variables.
const dbName = databaseConstants.bigDbName;

/**
 * Class for video merge job model.
 *
 * @class VideoMergeJob
 */
class VideoMergeJob extends ModelBase {
  /**
   * Constructor for video merge job model.
   *
   * @augments ModelBase
   *
   * @constructor
   */
  constructor() {
    super({ dbName: dbName });

    const oThis = this;

    oThis.tableName = 'video_merge_jobs';
  }

  /**
   * Format db data.
   *
   * @param {object} dbRow
   * @param {number} dbRow.id
   * @param {number} dbRow.user_id
   * @param {string} dbRow.merged_url
   * @param {number} dbRow.status
   * @param {string} dbRow.created_at
   * @param {string} dbRow.updated_at
   *
   * @return {object}
   */
  formatDbData(dbRow) {
    const oThis = this;

    const formattedData = {
      id: dbRow.id,
      userId: dbRow.user_id,
      mergedUrl: dbRow.merged_url,
      status: dbRow.status,
      createdAt: dbRow.created_at,
      updatedAt: dbRow.updated_at
    };

    return oThis.sanitizeFormattedData(formattedData);
  }

  /**
   * Fetch video merge job by id.
   *
   * @param {number} jobId
   *
   * @returns {Promise<{}>}
   */
  async fetchVideoMergeJobById(jobId) {
    const oThis = this;

    const dbRows = await oThis
      .select('*')
      .where({ id: jobId })
      .fire();

    if (dbRows.length === 0) {
      return {};
    }

    return oThis.formatDbData(dbRows[0]);
  }

  /**
   * Flush cache.
   *
   * @param {object} params
   * @param {number} [params.id]
   * @param {array<number>} [params.ids]
   *
   * @returns {Promise<void>}
   */
  static async flushCache(params) {
    const promisesArray = [];

    if (params.id) {
      const CacheKlass = require('./');
      promisesArray.push(new CacheKlass({ ids: [params.id] }).clear());
    }

    if (params.ids) {
      const CacheKlass = require('./');
      promisesArray.push(new CacheKlass({ ids: params.ids }).clear());
    }

    await Promise.all(promisesArray);
  }
}

module.exports = VideoMergeJob;
