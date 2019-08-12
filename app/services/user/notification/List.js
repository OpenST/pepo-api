const rootPrefix = '../../../..',
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  UserNotificationServiceBase = require(rootPrefix + '/app/services/user/notification/Base'),
  UpdateUserNotificationVisitDetailsService = require(rootPrefix +
    '/app/services/user/notification/UpdateUserNotificationVisitDetails'),
  UserNotificationsByUserIdPagination = require(rootPrefix +
    '/lib/cacheManagement/single/UserNotificationsByUserIdPagination'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  paginationConstants = require(rootPrefix + '/lib/globalConstant/pagination');

/**
 * Class for user notification list.
 *
 * @class UserNotification
 */
class UserNotification extends UserNotificationServiceBase {
  /**
   * Constructor for user notification list.
   *
   * @param {object} params
   * @param {object} params.current_user
   * @param {number/string} params.current_user.id
   * @param {string} [params.pagination_identifier]
   *
   * @augments ServiceBase
   *
   * @constructor
   */
  constructor(params) {
    super(params);

    const oThis = this;

    oThis.currentUserId = +params.current_user.id;
    oThis.paginationIdentifier = params[paginationConstants.paginationIdentifierKey] || null;

    oThis.limit = null;
    oThis.currentPageState = null;
    oThis.currentPageNumber = null;
    oThis.nextPageState = null;
  }

  /**
   * Validate and sanitize specific params.
   *
   * @sets oThis.limit, oThis.currentPageState, oThis.currentPageNumber
   *
   * @returns {Promise<never>}
   * @private
   */
  async _validateAndSanitizeParams() {
    const oThis = this;

    if (oThis.paginationIdentifier) {
      const parsedPaginationParams = oThis._parsePaginationParams(oThis.paginationIdentifier);
      oThis.currentPageState = parsedPaginationParams.page_state;
      oThis.currentPageNumber = parsedPaginationParams.page;
    } else {
      oThis.currentPageState = null;
      oThis.currentPageNumber = 1;
    }

    if (oThis.currentPageState) {
      if (!CommonValidators.validateNonZeroInteger(oThis.currentPageNumber) || oThis.currentPageNumber < 2) {
        return Promise.reject(
          responseHelper.paramValidationError({
            internal_error_identifier: 'a_s_u_n_l_vas_1',
            api_error_identifier: 'invalid_api_params',
            params_error_identifiers: ['invalid_pagination_identifier'],
            debug_options: { paginationIdentifier: oThis.paginationIdentifier }
          })
        );
      }
    }

    oThis.limit = paginationConstants.defaultUserNotificationPageSize;
  }

  /**
   * Fetch user notifications from cache.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _setUserNotification() {
    const oThis = this;

    const cacheResponse = await new UserNotificationsByUserIdPagination({
      userId: oThis.currentUserId,
      limit: oThis.limit,
      pageState: oThis.currentPageState,
      pageNumber: oThis.currentPageNumber
    }).fetch();

    if (cacheResponse.isFailure()) {
      return Promise.reject(cacheResponse);
    }

    oThis.userNotifications = cacheResponse.data.userNotifications;
    oThis.nextPageState = cacheResponse.data.pageState;
  }

  /**
   * Format notifications and update last visit time.
   *
   * @returns {Promise<never>}
   * @private
   */
  async _formatUserNotifications() {
    const oThis = this;

    await super._formatUserNotifications();

    await oThis._updateLastVisitedTime();
  }

  /**
   * Update notification centre last visit time.
   *
   * @returns {object}
   * @private
   */
  async _updateLastVisitedTime() {
    const oThis = this;

    if (oThis.currentPageState) {
      return;
    }

    const latestTimestamp = (oThis.formattedUserNotifications[0] || {}).lastActionTimestamp || Date.now();

    const updateParam = {
      user_id: oThis.currentUserId,
      last_visited_at: latestTimestamp
    };

    await new UpdateUserNotificationVisitDetailsService(updateParam).perform();
  }

  /**
   * Service response.
   *
   * @returns {object}
   * @private
   */
  _finalResponse() {
    const oThis = this;

    const response = super._finalResponse();

    const nextPagePayloadKey = {};

    if (oThis.nextPageState) {
      nextPagePayloadKey[paginationConstants.paginationIdentifierKey] = {
        page_state: oThis.nextPageState,
        page: oThis.currentPageNumber + 1
      };
    }

    response.meta = {
      [paginationConstants.nextPagePayloadKey]: nextPagePayloadKey
    };
    response.userNotificationList = oThis.formattedUserNotifications;

    return response;
  }

  /**
   * Returns default page limit.
   *
   * @returns {number}
   * @private
   */
  _defaultPageLimit() {
    return paginationConstants.defaultUserNotificationPageSize;
  }

  /**
   * Returns minimum page limit.
   *
   * @returns {number}
   * @private
   */
  _minPageLimit() {
    return paginationConstants.defaultUserNotificationPageSize;
  }

  /**
   * Returns maximum page limit.
   *
   * @returns {number}
   * @private
   */
  _maxPageLimit() {
    return paginationConstants.defaultUserNotificationPageSize;
  }

  /**
   * Returns current page limit.
   *
   * @returns {number}
   * @private
   */
  _currentPageLimit() {
    const oThis = this;

    return oThis.limit;
  }
}

module.exports = UserNotification;
