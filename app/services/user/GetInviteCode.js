const uuidV4 = require('uuid/v4');

const rootPrefix = '../../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  coreConstants = require(rootPrefix + '/config/coreConstants'),
  shareEntityConstants = require(rootPrefix + '/lib/globalConstant/shareEntity'),
  InviteCodeByUserIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/InviteCodeByUserIds'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  entityType = require(rootPrefix + '/lib/globalConstant/entityType');

/**
 * Class for invited users of current user search.
 *
 * @class GetInviteCode
 */
class GetInviteCode extends ServiceBase {
  /**
   * Constructor for invited users of current user search.
   *
   * @param {object} params
   * @param {object} params.currentUser
   * @param {number} params.currentUser.id
   *
   * @augments ServiceBase
   *
   * @constructor
   */
  constructor(params) {
    super();

    const oThis = this;

    oThis.currentUserId = params.currentUser.id;

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
    oThis.inviteCodeDetails['shareId'] = oThis.shareId;
  }

  /**
   * Prepare final response.
   *
   * @return {Promise<*|result>}
   * @private
   */
  async _prepareResponse() {
    const oThis = this;

    let inviteUrl = coreConstants.PA_DOMAIN + '/?invite=' + oThis.inviteCodeDetails.code;

    const response = {
      [entityType.share]: {
        id: oThis.shareId,
        kind: shareEntityConstants.inviteShareKind,
        url: inviteUrl,
        message: 'DUMMY_MESSAGE',
        title: 'DUMMY_TITLE', //optional
        subject: 'DUMMY_SUBJECT', //optional
        uts: Math.round(new Date() / 1000)
      },
      [entityType.inviteCode]: oThis.inviteCodeDetails
    };

    return responseHelper.successWithData(response);
  }
}

module.exports = GetInviteCode;
