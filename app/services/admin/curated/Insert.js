const rootPrefix = '../../../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  UserCache = require(rootPrefix + '/lib/cacheManagement/multi/User'),
  TagMultiCache = require(rootPrefix + '/lib/cacheManagement/multi/Tag'),
  CuratedEntityModel = require(rootPrefix + '/app/models/mysql/CuratedEntity'),
  CuratedEntityIdsByKindCache = require(rootPrefix + '/lib/cacheManagement/single/CuratedEntityIdsByKind'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  curatedEntitiesConstants = require(rootPrefix + '/lib/globalConstant/curatedEntities');

/**
 * Class to insert new entry in curated entities.
 *
 * @class Insert
 */
class Insert extends ServiceBase {
  /**
   * Constructor to insert new entry in curated entities.
   *
   * @param {object} params
   * @param {string} params.entity_kind
   * @param {number} params.entity_id
   *
   * @augments ServiceBase
   *
   * @constructor
   */
  constructor(params) {
    super();

    const oThis = this;

    oThis.entityKind = params.entity_kind;
    oThis.entityId = params.entity_id;

    oThis.entityIdsArrayLength = 0;
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

    await oThis.fetchExistingEntities();

    await oThis.updateEntities();

    return responseHelper.successWithData({});
  }

  /**
   * Validate and sanitize input parameters.
   *
   * @returns {Promise<never>}
   */
  async validateAndSanitize() {
    const oThis = this;

    if (oThis.entityKind === curatedEntitiesConstants.userEntityKind) {
      await oThis.fetchAndValidateUser();
    } else if (oThis.entityKind === curatedEntitiesConstants.userEntityKind) {
      await oThis.fetchAndValidateTag();
    } else {
      return Promise.reject(
        responseHelper.paramValidationError({
          internal_error_identifier: 'a_s_a_c_i_1',
          api_error_identifier: 'invalid_api_params',
          params_error_identifiers: ['invalid_entity_kind'],
          debug_options: { entityKind: oThis.entityKind }
        })
      );
    }
  }

  /**
   * Fetch and validate user.
   *
   * @returns {Promise<never>}
   */
  async fetchAndValidateUser() {
    const oThis = this;

    const userDetailsCacheResponse = await new UserCache({ ids: [oThis.entityId] }).fetch();
    if (userDetailsCacheResponse.isFailure()) {
      return Promise.reject(userDetailsCacheResponse);
    }

    const userData = userDetailsCacheResponse.data[oThis.entityId];

    if (!CommonValidators.validateNonEmptyObject(userData)) {
      return Promise.reject(
        responseHelper.paramValidationError({
          internal_error_identifier: 'a_s_a_c_i_2',
          api_error_identifier: 'invalid_api_params',
          params_error_identifiers: ['invalid_entity_id'],
          debug_options: { entityId: oThis.entityId }
        })
      );
    }
  }

  /**
   * Fetch and validate tag.
   *
   * @returns {Promise<never>}
   */
  async fetchAndValidateTag() {
    const oThis = this;

    const tagsCacheResponse = await new TagMultiCache({ ids: [oThis.entityId] }).fetch();
    if (tagsCacheResponse.isFailure()) {
      return Promise.reject(tagsCacheResponse);
    }

    const tagData = tagsCacheResponse.data[oThis.entityId];

    if (!CommonValidators.validateNonEmptyObject(tagData)) {
      return Promise.reject(
        responseHelper.paramValidationError({
          internal_error_identifier: 'a_s_a_c_i_3',
          api_error_identifier: 'invalid_api_params',
          params_error_identifiers: ['invalid_entity_id'],
          debug_options: { entityId: oThis.entityId }
        })
      );
    }
  }

  /**
   * Fetch existing entities.
   *
   * @sets oThis.entityIdsArrayLength
   *
   * @returns {Promise<never>}
   */
  async fetchExistingEntities() {
    const oThis = this;

    const cacheResponse = await new CuratedEntityIdsByKindCache({ entityKind: oThis.entityKind }).fetch();
    if (cacheResponse.isFailure()) {
      return Promise.reject(cacheResponse);
    }

    const entityIdsArray = cacheResponse.data[oThis.entityKind];

    // If entityId already exists in the curated entities table.
    if (entityIdsArray.indexOf(oThis.entityId) > -1) {
      return Promise.reject(
        responseHelper.paramValidationError({
          internal_error_identifier: 'a_s_a_c_i_4',
          api_error_identifier: 'invalid_api_params',
          params_error_identifiers: ['invalid_entity_id'],
          debug_options: { entityId: oThis.entityId }
        })
      );
    }

    oThis.entityIdsArrayLength = entityIdsArray.length;
  }

  /**
   * Update curated entities table.
   *
   * @returns {Promise<never>}
   */
  async updateEntities() {
    const oThis = this;

    const newElementPosition = oThis.entityIdsArrayLength + 1;
    const entityKindInt = curatedEntitiesConstants.invertedEntityKinds[oThis.entityKind];

    await new CuratedEntityModel().insertEntities([oThis.entityId, entityKindInt, newElementPosition]);

    await CuratedEntityModel.flushCache({ entityKind: oThis.entityKind });
  }
}

module.exports = Insert;
