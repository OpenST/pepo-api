const rootPrefix = '../../../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  CuratedEntityModel = require(rootPrefix + '/app/models/mysql/CuratedEntity'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  curatedEntitiesConstants = require(rootPrefix + '/lib/globalConstant/curatedEntities');

/**
 * Class to order curated entities.
 *
 * @class Update
 */
class Update extends ServiceBase {
  /**
   * Constructor to order curated entities.
   *
   * @param {object} params
   *
   * @augments ServiceBase
   *
   * @constructor
   */
  constructor(params) {
    super();

    const oThis = this;

    oThis.entityKind = params.entity_kind;
    oThis.entityIdsArray = params.entity_ids;
  }

  /**
   * Async perform.
   *
   * @returns {Promise<result>}
   * @private
   */
  async _asyncPerform() {
    const oThis = this;

    await oThis.validateAndSanitize();

    await oThis.deleteExistingEntities();

    await oThis.updateEntities();

    return responseHelper.successWithData();
  }

  /**
   * Validate and sanitize input parameters.
   *
   * @returns {Promise<never>}
   */
  async validateAndSanitize() {
    const oThis = this;

    if (oThis.entityIdsArray.length === 0 || oThis.entityIdsArray.length > 20) {
      return Promise.reject(
        responseHelper.paramValidationError({
          internal_error_identifier: 'a_s_a_c_u_1',
          api_error_identifier: 'invalid_api_params',
          params_error_identifiers: ['invalid_entity_ids'],
          debug_options: { entity_ids: oThis.entity_ids }
        })
      );
    }

    if (!curatedEntitiesConstants.invertedEntityKinds[oThis.entityKind]) {
      return Promise.reject(
        responseHelper.paramValidationError({
          internal_error_identifier: 'a_s_a_c_u_2',
          api_error_identifier: 'invalid_api_params',
          params_error_identifiers: ['invalid_entity_kind'],
          debug_options: { entity_kind: oThis.entity_kind }
        })
      );
    }
  }

  /**
   * Delete existing entries for the entity kind.
   *
   * @returns {Promise<void>}
   */
  async deleteExistingEntities() {
    const oThis = this;

    await new CuratedEntityModel().deleteAllOfKind(oThis.entityKind);

    await CuratedEntityModel.flushCache({ entityKind: oThis.entityKind });
  }

  async updateEntities() {
    const oThis = this;
  }

  async fetchUsers() {}
}

module.exports = Update;
