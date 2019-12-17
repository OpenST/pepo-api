const rootPrefix = '../../../..',
  PixelJobHandlerBase = require(rootPrefix + '/lib/jobs/pixel/handler/Base'),
  pixelConstants = require(rootPrefix + '/lib/globalConstant/pixel');

/**
 * Class for approve user as a creator pixel job processor.
 *
 * @class ApproveUserAsCreator
 */
class ApproveUserAsCreator extends PixelJobHandlerBase {
  /**
   * Constructor for approve user as a creator pixel job processor.
   *
   * @param {object} params
   * @param {string} params.approvedViaMedium
   * @param {number} params.adminId
   * @param {number} params.approvedUserId
   *
   * @augments PixelJobHandlerBase
   *
   * @constructor
   */
  constructor(params) {
    super();

    const oThis = this;

    oThis.approvedViaMedium = params.approvedViaMedium;
    oThis.adminId = params.adminId;
    oThis.approvedUserId = params.approvedUserId;
  }

  /**
   * Get specific variables for this pixel.
   *
   * @returns {{}}
   */
  getSpecificVars() {
    const oThis = this;

    return {
      entity_type: oThis.entityType,
      entity_action: oThis.entityAction,
      page_type: oThis.approvedViaMedium,
      page_name:
        oThis.approvedViaMedium === pixelConstants.userApprovedViaAdminUserProfileMedium ? oThis.approvedUserId : '',
      approved_user_id: oThis.approvedUserId,
      user_id: oThis.adminId // UserId is admin id for this pixel.
    };
  }

  /**
   * Get entity type.
   *
   * @returns {string}
   */
  get entityType() {
    return pixelConstants.userEntityType;
  }

  /**
   * Get entity action.
   *
   * @returns {string}
   */
  get entityAction() {
    return pixelConstants.creatorApprovedEntityAction;
  }
}

module.exports = ApproveUserAsCreator;
