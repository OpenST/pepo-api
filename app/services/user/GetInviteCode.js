const uuidV4 = require('uuid/v4');

const rootPrefix = '../../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  InviteCodeByUserIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/InviteCodeByUserIds'),
  coreConstants = require(rootPrefix + '/config/coreConstants'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  entityType = require(rootPrefix + '/lib/globalConstant/entityType'),
  shareEntityConstants = require(rootPrefix + '/lib/globalConstant/shareEntity');

/**
 * Class to get invite code for current user.
 *
 * @class GetInviteCode
 */
class GetInviteCode extends ServiceBase {
  /**
   * Constructor to get invite code for current user.
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

    const inviteUrl = coreConstants.PA_DOMAIN + '/?invite=' + oThis.inviteCodeDetails.code;

    const response = {
      [entityType.share]: {
        id: oThis.shareId,
        kind: shareEntityConstants.inviteShareKind,
        url: inviteUrl,
        message: 'DUMMY_MESSAGE',
        title: 'DUMMY_TITLE', // Optional.
        subject: 'DUMMY_SUBJECT', // Optional.
        uts: Math.round(new Date() / 1000)
      },
      [entityType.inviteCode]: oThis.inviteCodeDetails
    };

    return responseHelper.successWithData(response);
  }
}

module.exports = GetInviteCode;
