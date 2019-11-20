const rootPrefix = '../../../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  CuratedEntityModel = require(rootPrefix + '/app/models/mysql/CuratedEntity'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  curatedEntitiesConstants = require(rootPrefix + '/lib/globalConstant/curatedEntities');

/**
 * Class to order curated entities.
 *
 * @class Reorder
 */
class Reorder extends ServiceBase {
  /**
   * Constructor to order curated entities.
   *
   * @param {object} params
   * @param {string} params.entity_kind
   * @param {array<number>} params.entity_ids
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

    oThis.entityKindInt = 0;
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

    return responseHelper.successWithData({});
  }

  /**
   * Validate and sanitize input parameters.
   *
   * @sets oThis.entityKindInt
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

    oThis.entityKindInt = curatedEntitiesConstants.invertedEntityKinds[oThis.entityKind];

    if (!oThis.entityKindInt) {
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

  /**
   * Update curated entities table.
   *
   * @returns {Promise<*>}
   */
  async updateEntities() {
    const oThis = this;

    const insertArray = [];

    for (let index = 0; index < oThis.entityIdsArray.length; index++) {
      insertArray.push([oThis.entityIdsArray[index], oThis.entityKindInt, index]);
      // First position is entityId, second position is entityKind, third position is position of the entity.
    }

    await new CuratedEntityModel().insertEntities(insertArray);
  }
}

module.exports = Reorder;
