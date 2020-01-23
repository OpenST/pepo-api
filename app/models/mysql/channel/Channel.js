const rootPrefix = '../../../..',
  ModelBase = require(rootPrefix + '/app/models/mysql/Base'),
  databaseConstants = require(rootPrefix + '/lib/globalConstant/database'),
  channelConstants = require(rootPrefix + '/lib/globalConstant/channel/channels');

// Declare variables names.
const dbName = databaseConstants.channelDbName;

/**
 * Class for channels model.
 *
 * @class ChannelModel
 */
class ChannelModel extends ModelBase {
  /**
   * Constructor for channels model.
   *
   * @augments ModelBase
   *
   * @constructor
   */
  constructor() {
    super({ dbName: dbName });

    const oThis = this;

    oThis.tableName = 'channels';
  }

  /**
   * Format Db data.
   *
   * @param {object} dbRow
   * @param {number} dbRow.id
   * @param {number} dbRow.name
   * @param {number} dbRow.status
   * @param {number} dbRow.description_id
   * @param {number} dbRow.image_id
   * @param {number} dbRow.created_at
   * @param {number} dbRow.updated_at
   *
   * @returns {{}}
   */
  formatDbData(dbRow) {
    const oThis = this;

    const formattedData = {
      id: dbRow.id,
      name: dbRow.name,
      status: channelConstants.statuses[dbRow.status],
      descriptionId: dbRow.description_id,
      imageId: dbRow.image_id,
      createdAt: dbRow.created_at,
      updatedAt: dbRow.updated_at
    };

    return oThis.sanitizeFormattedData(formattedData);
  }

  /**
   * Fetch channel for given ids.
   *
   * @param {array} ids: channel ids
   *
   * @return {object}
   */
  async fetchByIds(ids) {
    const oThis = this;

    const dbRows = await oThis
      .select('*')
      .where(['id IN (?)', ids])
      .fire();

    const response = {};

    for (let index = 0; index < dbRows.length; index++) {
      const formatDbRow = oThis.formatDbData(dbRows[index]);
      response[formatDbRow.id] = formatDbRow;
    }

    return response;
  }

  /**
   * Flush cache.
   *
   * @param {object} params
   * @param {array<number>} [params.ids]
   *
   * @returns {Promise<*>}
   */
  static async flushCache(params) {
    const promisesArray = [];

    if (params.ids) {
      const ChannelByIds = require(rootPrefix + '/lib/cacheManagement/multi/ChannelByIds');
      promisesArray.push(new ChannelByIds({ ids: params.ids }).clear());
    }

    await Promise.all(promisesArray);
  }
}

module.exports = ChannelModel;
