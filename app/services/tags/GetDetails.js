const rootPrefix = '../../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  TagMultiCache = require(rootPrefix + '/lib/cacheManagement/multi/Tag'),
  entityTypeConstants = require(rootPrefix + '/lib/globalConstant/entityType'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

/**
 * Class to get tags details.
 *
 * @class GetTagDetails
 */
class GetTagDetails extends ServiceBase {
  /**
   * Constructor to get tag details.
   *
   * @param {object} params
   * @param {string} params.current_user - current user object
   * @param {number} params.tag_id - tag id for which details will be fetched
   *
   * @augments ServiceBase
   *
   * @constructor
   */
  constructor(params) {
    super();

    const oThis = this;

    oThis.current_user = params.current_user;
    oThis.tagId = params.tag_id;

    oThis.tagDetails = null;
  }

  /**
   * Async perform.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _asyncPerform() {
    const oThis = this;

    await oThis._getTagsDetails();

    return responseHelper.successWithData({
      [entityTypeConstants.tag]: oThis.tagDetails
    });
  }

  /**
   * Get tags details.
   *
   * @sets oThis.tagDetails
   *
   * @returns {Promise<void>}
   * @private
   */
  async _getTagsDetails() {
    const oThis = this;

    const tagsResponse = await new TagMultiCache({ ids: [oThis.tagId] }).fetch();

    if (
      !tagsResponse ||
      !tagsResponse.data ||
      !CommonValidators.validateNonEmptyObject(tagsResponse.data[oThis.tagId])
    ) {
      return Promise.reject(
        responseHelper.paramValidationError({
          internal_error_identifier: 'a_s_t_gd_1',
          api_error_identifier: 'invalid_api_params',
          params_error_identifiers: ['invalid_tag_id'],
          debug_options: {}
        })
      );
    }

    oThis.tagDetails = tagsResponse.data[oThis.tagId];
  }
}

module.exports = GetTagDetails;
