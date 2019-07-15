const rootPrefix = '../../..',
  ModelBase = require(rootPrefix + '/app/models/mysql/Base'),
  userContributorConstants = require(rootPrefix + '/lib/globalConstant/userContributor'),
  coreConstants = require(rootPrefix + '/config/coreConstants');

const dbName = 'pepo_api_' + coreConstants.environment;

class UserContributor extends ModelBase {
  /**
   * User Contributor model
   *
   * @constructor
   */
  constructor() {
    super({ dbName: dbName });

    const oThis = this;

    oThis.tableName = 'user_contributors';
  }

  /**
   *
   * @param dbRow
   * @return {object}
   */
  formatDbData(dbRow) {
    return {
      id: dbRow.id,
      userId: dbRow.user_id,
      contributedByUserId: dbRow.contributed_by_user_id,
      totalAmount: dbRow.total_amount,
      totalTransactions: dbRow.total_transactions,
      createdAt: dbRow.created_at,
      updatedAt: dbRow.updated_at
    };
  }

  /**
   * List Of Formatted Column names that can be exposed by service
   *
   *
   * @returns {Array}
   */
  safeFormattedColumnNames() {
    return ['id', 'userId', 'contributedByUserId', 'totalTransactions', 'totalAmount', 'createdAt', 'updatedAt'];
  }

  /**
   * Fetch user ids
   *
   * @param {object} params
   * @param {Array} params.contributedByUserId
   * @param {number} [params.page]
   * @param {number} [params.limit]
   *
   * @returns {Promise<*>}
   */
  async fetchPaginatedUserIdsForContributedByUserId(params) {
    const oThis = this;

    const page = params.page,
      limit = params.limit,
      offset = (page - 1) * limit;

    let dbRows = await oThis
      .select(['user_id'])
      .where({ contributed_by_user_id: params.contributedByUserId })
      .limit(limit)
      .offset(offset)
      .order_by('id DESC')
      .fire();

    let response = [];

    for (let index = 0; index < dbRows.length; index++) {
      response.push(dbRows[index].user_id);
    }

    return response;
  }

  /**
   * Fetch contributed by user ids
   *
   * @param {object} params
   * @param {Array} params.userId
   * @param {number} [params.page]
   * @param {number} [params.limit]
   *
   * @returns {Promise<*>}
   */
  async fetchPaginatedUserIdsForUserId(params) {
    const oThis = this;

    const page = params.page,
      limit = params.limit,
      offset = (page - 1) * limit;

    let dbRows = await oThis
      .select(['contributed_by_user_id'])
      .where({ user_id: params.userId })
      .limit(limit)
      .offset(offset)
      .order_by('id DESC')
      .fire();

    let response = [];

    for (let index = 0; index < dbRows.length; index++) {
      response.push(dbRows[index].contributed_by_user_id);
    }

    return response;
  }

  /***
   * Fetch users contributed by object
   * contributedByUserId paid to user ids
   *
   * @param userIds {Array} - Array of user id
   * @param contributedByUserId {Integer} - id of user who contributed to userId
   *
   * @return {Object}
   */
  async fetchByUserIdsAndcontributedByUserId(userIds, contributedByUserId) {
    const oThis = this;
    let dbRows = await oThis
      .select('*')
      .where({ user_id: userIds, contributed_by_user_id: contributedByUserId })
      .fire();

    let response = {};

    for (let index = 0; index < dbRows.length; index++) {
      let formatDbRow = oThis.formatDbData(dbRows[index]);
      response[formatDbRow.userId] = formatDbRow;
    }

    return response;
  }

  /***
   * Flush cache
   *
   * @param {object} params
   *
   * @returns {Promise<*>}
   */
  static async flushCache(params, options) {
    options = options || {};

    if (options.isInsert) {
      if (params.contributedByUserId) {
        const UserContributorCache = require(rootPrefix +
          '/lib/cacheManagement/single/UserContributorContributedByPagination');
        await new UserContributorCache({
          contributedByUserId: params.contributedByUserId
        }).clear();
      }

      if (params.userId) {
        const UserContributorByUserIdCache = require(rootPrefix +
          '/lib/cacheManagement/single/UserContributorByUserIdPagination');
        await new UserContributorByUserIdCache({
          userId: params.userId
        }).clear();
      }
    }

    if (params.userId && params.contributedByUserId) {
      const UserContributorMultiCache = require(rootPrefix +
        '/lib/cacheManagement/multi/UserContributorByUserIdsAndContributedByUserId');
      await new UserContributorByUserIdCache({
        contributedByUserId: params.contributedByUserId,
        userIds: [params.userId]
      }).clear();
    }
  }
}

module.exports = UserContributor;
