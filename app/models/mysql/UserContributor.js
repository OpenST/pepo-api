const rootPrefix = '../../..',
  ModelBase = require(rootPrefix + '/app/models/mysql/Base'),
  databaseConstants = require(rootPrefix + '/lib/globalConstant/database');

// Declare variables.
const dbName = databaseConstants.userDbName;

/**
 * Class for user contributor model.
 *
 * @class UserContributor
 */
class UserContributor extends ModelBase {
  /**
   * Constructor for user contributor model.
   *
   * @augments ModelBase
   *
   * @constructor
   */
  constructor() {
    super({ dbName: dbName });

    const oThis = this;

    oThis.tableName = 'user_contributors';
  }

  /**
   * Format Db data.
   *
   * @param {object} dbRow
   * @param {number} dbRow.id
   * @param {number} dbRow.user_id
   * @param {number} dbRow.contributed_by_user_id
   * @param {number} dbRow.total_amount
   * @param {number} dbRow.total_transactions
   * @param {number} dbRow.created_at
   * @param {number} dbRow.updated_at
   *
   * @return {object}
   */
  formatDbData(dbRow) {
    const oThis = this;

    const formattedData = {
      id: dbRow.id,
      userId: dbRow.user_id,
      contributedByUserId: dbRow.contributed_by_user_id,
      totalAmount: dbRow.total_amount,
      totalTransactions: dbRow.total_transactions,
      createdAt: dbRow.created_at,
      updatedAt: dbRow.updated_at
    };

    return oThis.sanitizeFormattedData(formattedData);
  }

  /**
   * List of formatted column names that can be exposed by service.
   *
   * @returns {array}
   */
  safeFormattedColumnNames() {
    return ['id', 'userId', 'contributedByUserId', 'totalTransactions', 'totalAmount', 'createdAt', 'updatedAt'];
  }

  /**
   * Fetch user ids.
   *
   * @param {object} params
   * @param {array} params.contributedByUserId
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

    const dbRows = await oThis
      .select(['user_id, total_amount, updated_at'])
      .where({ contributed_by_user_id: params.contributedByUserId })
      .limit(limit)
      .offset(offset)
      .order_by('id DESC')
      .fire();

    const userIds = [];
    const contributionUsersByUserIdsMap = {};

    for (let index = 0; index < dbRows.length; index++) {
      const userContributor = dbRows[index];
      userIds.push(userContributor.user_id);
      contributionUsersByUserIdsMap[userContributor.user_id] = oThis.formatDbData(userContributor);
    }

    return { userIds: userIds, contributionUsersByUserIdsMap: contributionUsersByUserIdsMap };
  }

  /**
   * Fetch contributed by user ids.
   *
   * @param {object} params
   * @param {array} params.userId
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

    const dbRows = await oThis
      .select(['contributed_by_user_id, total_amount, updated_at'])
      .where({ user_id: params.userId })
      .limit(limit)
      .offset(offset)
      .order_by('id DESC')
      .fire();

    const contributedByUserIds = [];
    const contributionUsersByUserIdsMap = {};

    for (let index = 0; index < dbRows.length; index++) {
      const userContributor = dbRows[index];
      contributedByUserIds.push(userContributor.contributed_by_user_id);
      contributionUsersByUserIdsMap[userContributor.contributed_by_user_id] = oThis.formatDbData(userContributor);
    }

    return { contributedByUserIds: contributedByUserIds, contributionUsersByUserIdsMap: contributionUsersByUserIdsMap };
  }

  /**
   * Fetch users contributed by object contributedByUserId paid to user ids.
   *
   * @param {array} userIds: Array of user id
   * @param {number} contributedByUserId: id of user who contributed to userId
   *
   * @return {object}
   */
  async fetchByUserIdsAndContributedByUserId(userIds, contributedByUserId) {
    const oThis = this;

    const dbRows = await oThis
      .select('*')
      .where({ user_id: userIds, contributed_by_user_id: contributedByUserId })
      .fire();

    const response = {};

    for (let index = 0; index < dbRows.length; index++) {
      const formatDbRow = oThis.formatDbData(dbRows[index]);
      response[formatDbRow.userId] = formatDbRow;
    }

    return response;
  }

  /**
   * Update by user id and contributed by user id.
   *
   * @param {number} params.userId: user Id
   * @param {number} params.contributedByUserId: User Id who contributed for the video
   * @param {number} params.totalAmount: Total amount
   *
   * @returns {Promise<*>}
   */
  async updateByUserIdAndContributedByUserId(params) {
    const oThis = this,
      totalTransactions = 1;

    return oThis
      .update([
        'total_amount = total_amount + ? ,total_transactions = total_transactions + ? ',
        params.totalAmount,
        totalTransactions
      ])
      .where({ user_id: params.userId, contributed_by_user_id: params.contributedByUserId })
      .fire();
  }

  /**
   * Update by userId and contributed by user id.
   *
   * @param {number} params.userId: user Id
   * @param {number} params.contributedByUserId: User Id who contributed for the video
   * @param {number} params.totalAmount: Total amount
   *
   * @returns {Promise<*>}
   */
  async insertUserContributor(params) {
    const oThis = this;

    const totalTransactions = 1;

    return oThis
      .insert({
        user_id: params.userId,
        contributed_by_user_id: params.contributedByUserId,
        total_amount: params.totalAmount,
        total_transactions: totalTransactions
      })
      .fire();
  }

  /**
   * Flush cache.
   *
   * @param {object} params
   * @param {string} params.contributedByUserId
   * @param {string} params.userId
   * @param {object} [options]
   * @param {string} [options.isInsert]
   *
   * @returns {Promise<*>}
   */
  static async flushCache(params, options = {}) {
    const promisesArray = [];

    if (options.isInsert) {
      if (params.contributedByUserId) {
        const UserContributorCache = require(rootPrefix +
          '/lib/cacheManagement/single/UserContributorContributedByPagination');
        promisesArray.push(new UserContributorCache({ contributedByUserId: params.contributedByUserId }).clear());
      }

      if (params.userId) {
        const UserContributorByUserIdCache = require(rootPrefix +
          '/lib/cacheManagement/single/UserContributorByUserIdPagination');
        promisesArray.push(new UserContributorByUserIdCache({ userId: params.userId }).clear());
      }
    }

    if (params.userId && params.contributedByUserId) {
      const UserContributorMultiCache = require(rootPrefix +
        '/lib/cacheManagement/multi/UserContributorByUserIdsAndContributedByUserId');
      promisesArray.push(
        new UserContributorMultiCache({
          contributedByUserId: params.contributedByUserId,
          userIds: [params.userId]
        }).clear()
      );
    }

    await Promise.all(promisesArray);
  }

  /**
   * Index name.
   *
   * @returns {string}
   */
  static get userIdContributedByUniqueIndexName() {
    return 'idx_1';
  }
}

module.exports = UserContributor;
