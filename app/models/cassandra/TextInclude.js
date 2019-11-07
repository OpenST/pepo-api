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
   * Separate entity identifier to find entity kind and id.
   *
   * @param entityIdentifier
   * @returns {{entityKind: *, entityId: *}}
   */
  splitEntityIdentifier(entityIdentifier) {
    let splittedArray = entityIdentifier.split('_');

    return {
      entityKind: splittedArray[0],
      entityId: splittedArray[1]
    };
  }

  /**
   * Create entity identifier to find entity kind and id.
   *
   * @param entityKind
   * @param entityId
   * @returns {string}
   */
  createEntityIdentifier(entityKind, entityId) {
    return entityKind + '_' + entityId;
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
   * Flush cache.
   *
   * @returns {Promise<*>}
   */
  static async flushCache() {
    // Do nothing.
  }
}

module.exports = TextIncludeModel;
