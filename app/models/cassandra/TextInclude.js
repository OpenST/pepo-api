const rootPrefix = '../../..',
  CassandraModelBase = require(rootPrefix + '/app/models/cassandra/Base'),
  cassandraKeyspaceConstants = require(rootPrefix + '/lib/globalConstant/cassandraKeyspace'),
  textIncludeConstants = require(rootPrefix + '/lib/globalConstant/cassandra/textInclude');

// Declare variables.
const keyspace = cassandraKeyspaceConstants.cassandraKeyspaceName;

/**
 * Class for text include model.
 *
 * @class TextIncludeModel
 */
class TextIncludeModel extends CassandraModelBase {
  /**
   * Constructor for text include model.
   *
   * @augments CassandraModelBase
   *
   * @constructor
   */
  constructor() {
    super({ keyspace: keyspace });

    const oThis = this;

    oThis.tableName = 'text_includes';
  }

  /**
   * Keys for table text_includes.
   *
   * @returns {{partition: string[], sort: string[]}}
   */
  keyObject() {
    return {
      partition: [textIncludeConstants.shortToLongNamesMap.text_id],
      sort: [textIncludeConstants.shortToLongNamesMap.entity_identifier]
    };
  }

  get longToShortNamesMap() {
    return textIncludeConstants.longToShortNamesMap;
  }

  /**
   * Format db data.
   *
   * @param {object} dbRow
   * @param {number} dbRow.text_id
   * @param {string} dbRow.entity_identifier
   * @param {string} dbRow.replaceable_text
   *
   * @returns {object}
   */
  formatDbData(dbRow) {
    const oThis = this;

    /* eslint-disable */
    const formattedData = {
      textId: dbRow.text_id ? Number(dbRow.text_id) : undefined,
      entityIdentifier: dbRow.entity_identifier ? dbRow.entity_identifier : undefined,
      replaceableText: dbRow.replaceable_text ? dbRow.replaceable_text : undefined
    };
    /* eslint-enable */

    return oThis.sanitizeFormattedData(formattedData);
  }

  /**
   * Fetch includes by text id
   * @param textIds - ids of texts table
   * @returns {Promise<{}>}
   */
  async fetchByTextIds(textIds) {
    const oThis = this;
    const query = `select * from ${oThis.queryTableName} where text_id in ?;`;
    const params = [textIds];

    const queryRsp = await oThis.fire(query, params);

    if (queryRsp.rows.length === 0) {
      return {};
    }

    const result = {};

    for (let ind = 0; ind < queryRsp.rows.length; ind++) {
      const row = queryRsp.rows[ind];

      const formattedRow = oThis.formatDbData(row);

      result[formattedRow.textId] = result[formattedRow.textId] || [];
      result[formattedRow.textId].push(formattedRow);
    }

    return result;
  }

  /**
   * Fetch latest last action timestamp
   *
   * @param queryParams
   * @returns {*}
   */
  async fetchTextIncludes(queryParams) {
    const oThis = this;

    const query = `select * from ${oThis.queryTableName} where text_id = ? and entity_identifier = ?;`;
    const params = [queryParams.textId, queryParams.entityIdentifier];

    const queryRsp = await oThis.fire(query, params);

    if (queryRsp.rows.length === 0) {
      return {};
    }

    return oThis.formatDbData(queryRsp.rows[0]);
  }

  /**
   *
   *
   * @param textId
   * @param entityIdentifiers
   * @param replaceableTexts
   * @returns {Promise<void>}
   */
  async insertInTextIncludes(textId, entityIdentifiers, replaceableTexts) {
    const oThis = this,
      queries = [];

    const query = `INSERT INTO ${oThis.queryTableName}(text_id, entity_identifier, replaceable_text) VALUES(?, ?, ?) `;

    for (let ind = 0; ind < entityIdentifiers.length; ind++) {
      const updateParam = [textId, entityIdentifiers[ind], replaceableTexts[ind]];
      queries.push({ query: query, params: updateParam });
    }

    if (queries.length > 0) {
      await oThis.batchFire(queries);
    }
  }

  /**
   * Delete tags
   * @param textId
   * @returns {Promise<void>}
   */
  async deleteTags(textId, tagEntityIdentifiers) {
    const oThis = this;

    const query = `DELETE FROM ${oThis.queryTableName} WHERE text_id = ? AND entity_identifier in ?`;

    const deleteParams = [textId, tagEntityIdentifiers];
    await oThis.batchFire([{ query: query, params: deleteParams }]);
  }

  /**
   * Flush cache.
   * @param {object} params
   * @param {array<number>} params.textIds
   * @returns {Promise<*>}
   */
  static async flushCache(params) {
    // Do nothing.
    const TextIncludesByIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/TextIncludesByTextIds');
    await new TextIncludesByIdsCache({ ids: params.textIds }).clear();
  }
}

module.exports = TextIncludeModel;
