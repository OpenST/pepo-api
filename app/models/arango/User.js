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
   * Fetch posts for a user
   *
   * @param {object} queryParams
   * @param {string} queryParams.userId
   * @param {number} queryParams.pageNumber
   * @param {number} queryParams.limit
   *
   * @returns {Promise<*>}
   */
  async getPosts(queryParams) {
    const oThis = this;

    const offset = queryParams.limit * (queryParams.pageNumber - 1);

    const query = `WITH users
     FOR v, e, p IN 1..2 OUTBOUND @startVertex followers, posts, replies
     PRUNE  IS_SAME_COLLECTION('posts',p.edges[0]) OR IS_SAME_COLLECTION('replies',p.edges[0])
     OPTIONS {uniqueVertices: 'global', bfs: true}
     FILTER IS_SAME_COLLECTION('videos',v)
     SORT v.updated_at ASC
     LIMIT @offset, @limit
     RETURN DISTINCT v`;

    const vars = {
      startVertex: `${oThis.collectionName}/${queryParams.userId}`,
      limit: queryParams.limit,
      offset: offset
    };

    const result = await oThis.query(query, vars);
    const dbRows = result._result;

    const response = [];

    for (let index = 0; index < dbRows.length; index++) {
      response.push(dbRows[index]._key);
    }

    return { videoIds: response };
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
