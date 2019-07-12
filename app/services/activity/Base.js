const rootPrefix = '../../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  UserMultiCache = require(rootPrefix + '/lib/cacheManagement/multi/User'),
  ExternalEntityByIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/ExternalEntityByIds'),
  TokenUserDetailByUserIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/TokenUserByUserIds'),
  TransactionByIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/TransactionByIds'),
  TextsByIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/TextsByIds'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  paginationConstants = require(rootPrefix + '/lib/globalConstant/pagination'),
  externalEntityConstants = require(rootPrefix + '/lib/globalConstant/externalEntity');

/**
 * Base class for activity service.
 *
 * @class ActivityBase
 */
class ActivityBase extends ServiceBase {
  /**
   * Constructor for activity service base.
   *
   * @param {object} params
   * @param {string} [params.limit.pagination_identifier]
   *
   * @augments ServiceBase
   */
  constructor(params) {
    super(params);

    const oThis = this;

    oThis.paginationIdentifier = params[paginationConstants.paginationIdentifierKey] || null;

    oThis.limit = oThis._defaultPageLimit();

    oThis.paginationTimestamp = null;
    oThis.lastActivityId = null;
    oThis.activityIds = [];
    oThis.textIds = [];
    oThis.userIds = [];
    oThis.externalEntityIds = [];
    oThis.ostTransactionMap = {};
    oThis.activityMap = {};
    oThis.textMap = {};
    oThis.externalEntityGifMap = {};
    oThis.tokenUsersByUserIdMap = {};
    oThis.usersMap = {};

    oThis.responseMetaData = {
      [paginationConstants.nextPagePayloadKey]: {}
    };
  }

  /**
   * Async perform.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _asyncPerform() {
    const oThis = this;

    await oThis._validateAndSanitizeParams();

    await oThis._fetchActivityDetails();

    if (oThis.activityIds.length === 0) {
      return responseHelper.successWithData(oThis._finalResponse());
    }

    await oThis._fetchTransactions();

    await Promise.all([
      oThis._fetchTexts(),
      oThis._fetchExternalEntities(),
      oThis._fetchUsers(),
      oThis._fetchTokenUser()
    ]);

    oThis._processActivityDetails();

    return responseHelper.successWithData(oThis._finalResponse());
  }

  /**
   * Validate and sanitize specific params.
   *
   * @sets oThis.paginationTimestamp
   *
   * @returns {Promise<never>}
   * @private
   */
  async _validateAndSanitizeParams() {
    const oThis = this;

    if (oThis.paginationIdentifier) {
      const parsedPaginationParams = oThis._parsePaginationParams(oThis.paginationIdentifier);

      oThis.paginationTimestamp = parsedPaginationParams.pagination_timestamp; // Override paginationTimestamp number.
    } else {
      oThis.paginationTimestamp = null;
    }

    // Validate limit.
    return oThis._validatePageSize();
  }

  /**
   * Fetch Transactions.
   *
   * @sets oThis.ostTransactionMap, oThis.textIds, oThis.externalEntityIds, oThis.userIds
   *
   * @returns {result}
   * @private
   */
  async _fetchTransactions() {
    const oThis = this;

    let ostTxIds = [];

    for (let index = 0; index < oThis.activityIds.length; index++) {
      const activityId = oThis.activityIds[index];
      const activityObj = oThis.activityMap[activityId];

      ostTxIds.push(activityObj.entityId);
    }

    ostTxIds = [...new Set(ostTxIds)]; // Removes duplication.

    const cacheResp = await new TransactionByIdsCache({ ids: ostTxIds }).fetch();

    if (cacheResp.isFailure()) {
      return Promise.reject(cacheResp);
    }

    oThis.ostTransactionMap = cacheResp.data;

    for (let txId in oThis.ostTransactionMap) {
      const txObj = oThis.ostTransactionMap[txId],
        txExtraData = txObj.extraData;

      if (txObj.textId) {
        oThis.textIds.push(txObj.textId);
      }

      if (txObj.giphyId) {
        oThis.externalEntityIds.push(txObj.giphyId);
      }

      oThis.userIds.push(txObj.fromUserId);
      oThis.userIds = oThis.userIds.concat(txExtraData.toUserIds);
    }

    return responseHelper.successWithData({});
  }

  /**
   * Fetch text.
   *
   * @sets  oThis.textMap
   *
   * @returns {Promise<void>}
   * @private
   */
  async _fetchTexts() {
    const oThis = this;

    oThis.textIds = [...new Set(oThis.textIds)]; // Removes duplication.

    if (oThis.textIds.length < 1) {
      return;
    }

    const cacheResp = await new TextsByIdsCache({ ids: oThis.textIds }).fetch();

    if (cacheResp.isFailure()) {
      return Promise.reject(cacheResp);
    }

    oThis.textMap = cacheResp.data;
  }

  /**
   * Fetch external entities data.
   *
   * @sets  oThis.userIds
   *
   * @returns {Promise<void>}
   * @private
   */
  async _fetchExternalEntities() {
    const oThis = this;

    oThis.externalEntityIds = [...new Set(oThis.externalEntityIds)]; // Removes duplication.

    if (oThis.externalEntityIds.length === 0) {
      return;
    }

    // Fetch external entity details.
    const cacheResp = await new ExternalEntityByIdsCache({ ids: oThis.externalEntityIds }).fetch();

    if (cacheResp.isFailure()) {
      return Promise.reject(cacheResp);
    }

    oThis.externalEntityGifMap = cacheResp.data;

    return;
  }

  /**
   * Fetch users from cache.
   *
   * @sets oThis.usersMap
   *
   * @returns {Promise<void>}
   * @private
   */
  async _fetchUsers() {
    const oThis = this;

    oThis.userIds = [...new Set(oThis.userIds)];

    if (oThis.userIds.length === 0) {
      return;
    }

    const cacheResp = await new UserMultiCache({ ids: oThis.userIds }).fetch();

    if (cacheResp.isFailure()) {
      return Promise.reject(cacheResp);
    }

    oThis.usersMap = cacheResp.data;

    return;
  }

  /**
   * Fetch token user.
   *
   * @sets oThis.tokenUsersByUserIdMap
   *
   * @return {Promise<void>}
   * @private
   */
  async _fetchTokenUser() {
    const oThis = this;

    if (oThis.userIds.length === 0) {
      return responseHelper.successWithData({});
    }

    const cacheResp = await new TokenUserDetailByUserIdsCache({ userIds: oThis.userIds }).fetch();

    if (cacheResp.isFailure()) {
      return Promise.reject(cacheResp);
    }

    oThis.tokenUsersByUserIdMap = cacheResp.data;

    return Promise.resolve(responseHelper.successWithData({}));
  }

  /**
   * Fetch activity details.
   *
   * @sets oThis.activityMap
   *
   * @returns {result}
   * @private
   */
  _processActivityDetails() {
    const oThis = this;

    oThis.paginationTimestamp = oThis.activityMap[oThis.lastActivityId].publishedTs;

    for (let index = 0; index < oThis.activityIds.length; index++) {
      const activityId = oThis.activityIds[index];
      const activityObj = oThis.activityMap[activityId],
        activityExtraData = activityObj.extraData;

      const transactionObj = oThis.ostTransactionMap[activityObj.entityId];

      let externalEntityGifObj = {},
        textObj = {};

      if (transactionObj.giphyId) {
        externalEntityGifObj = oThis.externalEntityGifMap[transactionObj.giphyId];
      }

      if (transactionObj.textId) {
        textObj = oThis.textMap[transactionObj.textId];
      }

      oThis.activityMap[activityId].payload = {
        text: textObj.text || '',
        ostTransactionId: activityObj.entityId,
        gifDetailId: externalEntityGifObj.entityId || ''
      };
    }

    return responseHelper.successWithData({});
  }

  /**
   * Service response.
   *
   * @returns {*|result}
   * @private
   */
  _finalResponse() {
    throw new Error('Sub-class to implement.');
  }

  /**
   * Fetch activity details map.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _fetchActivityDetails() {
    throw new Error('Sub-class to implement.');
  }

  /**
   * Default page limit.
   *
   * @private
   */
  _defaultPageLimit() {
    throw new Error('Sub-class to implement.');
  }

  /**
   * Min page limit.
   *
   * @private
   */
  _minPageLimit() {
    throw new Error('Sub-class to implement.');
  }

  /**
   * Max page limit.
   *
   * @private
   */
  _maxPageLimit() {
    throw new Error('Sub-class to implement.');
  }

  /**
   * Current page limit.
   *
   * @private
   */
  _currentPageLimit() {
    const oThis = this;

    return oThis.limit;
  }
}

module.exports = ActivityBase;
