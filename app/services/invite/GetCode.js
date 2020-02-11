const uuidV4 = require('uuid/v4');

const rootPrefix = '../../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  InviteCodeByUserIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/InviteCodeByUserIds'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  entityTypeConstants = require(rootPrefix + '/lib/globalConstant/entityType'),
  shareEntityConstants = require(rootPrefix + '/lib/globalConstant/shareEntity');

/**
 * Class to get invite code for current user.
 *
 * @class GetCode
 */
class GetCode extends ServiceBase {
  /**
   * Constructor to get invite code for current user.
   *
   * @param {object} params
   * @param {object} params.current_user
   * @param {number} params.current_user.id
   *
   * @augments ServiceBase
   *
   * @constructor
   */
  constructor(params) {
    super();

    const oThis = this;

    oThis.currentUserId = params.current_user.id;

    oThis.shareId = uuidV4();

    oThis.inviteCodeDetails = {};
  }

  /**
   * Async perform.
   *
   * @returns {Promise<*|result>}
   * @private
   */
  async _asyncPerform() {
    const oThis = this;

    await oThis._fetchInviterCodeDetails();

    return oThis._prepareResponse();
  }

  /**
   * Fetch invite code details of current user.
   *
   * @sets oThis.inviteCodeDetails
   *
   * @returns {Promise<never>}
   * @private
   */
  async _fetchInviterCodeDetails() {
    const oThis = this;

    const inviteCodeByUserIdCacheResponse = await new InviteCodeByUserIdsCache({
      userIds: [oThis.currentUserId]
    }).fetch();

    if (inviteCodeByUserIdCacheResponse.isFailure()) {
      return Promise.reject(inviteCodeByUserIdCacheResponse);
    }

    oThis.inviteCodeDetails = inviteCodeByUserIdCacheResponse.data[oThis.currentUserId];
    oThis.inviteCodeDetails.shareId = oThis.shareId;
  }

  /**
   * Prepare final response.
   *
   * @returns {Promise<*|result>}
   * @private
   */
  async _prepareResponse() {
    const oThis = this;

    const inviteUrl = shareEntityConstants.inviteShareUrl + oThis.inviteCodeDetails.code;

    const response = {
      [entityTypeConstants.share]: Object.assign(
        {
          id: oThis.shareId,
          kind: shareEntityConstants.inviteShareKind,
          url: inviteUrl,
          uts: Math.round(new Date() / 1000)
        },
        shareEntityConstants.getInviteShareEntity(inviteUrl)
      ),
      [entityTypeConstants.inviteCode]: oThis.inviteCodeDetails
    };

    return responseHelper.successWithData(response);
  }
}

module.exports = GetCode;
