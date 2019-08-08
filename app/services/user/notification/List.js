const rootPrefix = '../../../..',
  UserNotificationServiceBase = require(rootPrefix + '/app/services/user/notification/Base'),
  paginationConstants = require(rootPrefix + '/lib/globalConstant/pagination');

/**
 * Class for user Notification List.
 *
 * @class UserNotification
 */
class UserNotification extends UserNotificationServiceBase {
  /**
   * Constructor for user contribution base.
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
    oThis.last_action_timestamp = null;
  }

  /**
   * Validate and sanitize specific params.
   *
   * @sets oThis.last_action_timestamp, oThis.limit
   *
   * @returns {Promise<never>}
   * @private
   */
  async _validateAndSanitizeParams() {
    const oThis = this;

    if (oThis.paginationIdentifier) {
      const parsedPaginationParams = oThis._parsePaginationParams(oThis.paginationIdentifier);
      oThis.last_action_timestamp = parsedPaginationParams.last_action_timestamp;
    } else {
      oThis.last_action_timestamp = null;
    }
    oThis.limit = paginationConstants.defaultUserNotificationPageSize;

    return;
  }

  /**
   * Fetch user notifications from cache.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _setUserNotification() {
    const oThis = this;
    //todo:
  }

  /**
   * Service response.
   *
   * @returns {object}
   * @private
   */
  finalResponse() {
    const oThis = this;

    const response = super._finalResponse().data;

    if (response.userNotificationList.length === oThis.limit) {
      nextPagePayloadKey[paginationConstants.paginationIdentifierKey] = {
        last_action_timestamp:
          response.userNotificationList[response.userNotificationList.length - 1].lastActionTimestamp
      };
    }

    const responseMetaData = {
      [paginationConstants.nextPagePayloadKey]: nextPagePayloadKey
    };

    response['meta'] = responseMetaData;
    return responseHelper.successWithData(response);
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
