const rootPrefix = '../../..',
  ModelBase = require(rootPrefix + '/app/models/mysql/Base'),
  coreConstants = require(rootPrefix + '/config/coreConstants'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  KmsWrapper = require(rootPrefix + '/lib/authentication/KmsWrapper'),
  kmsPurposeConstants = require(rootPrefix + '/lib/globalConstant/kms'),
  globalSaltConstants = require(rootPrefix + '/lib/globalConstant/globalSalt');

// Declare variables.
const dbName = 'pepo_api_' + coreConstants.environment;

/**
 * Class for global salt model.
 *
 * @class GlobalSalt
 */
class GlobalSalt extends ModelBase {
  /**
   * Constructor for global salt model.
   *
   * @augments ModelBase
   *
   * @constructor
   */
  constructor() {
    super({ dbName: dbName });

    const oThis = this;

    oThis.tableName = 'global_salts';
  }

  /**
   * Get encryption salt by id.
   *
   * @param {string/number} id
   *
   * @returns {Promise<any>}
   */
  async getById(id) {
    const oThis = this;

    return oThis
      .select('*')
      .where({ id: id })
      .fire();
  }

  /**
   * Create encryption salt for given kind.
   *
   * @param {string} purpose
   * @param {string} kind
   *
   * @returns {Promise<any>}
   */
  async createEncryptionSalt(purpose, kind) {
    const oThis = this;

    const KMSObject = new KmsWrapper(purpose);

    return new Promise(function(onResolve) {
      KMSObject.generateDataKey()
        .then(async function(response) {
          const addressSalt = response.CiphertextBlob;

          const insertedRec = await oThis
            .insert({
              kind: globalSaltConstants.invertedKinds[kind],
              salt: addressSalt
            })
            .fire();
          onResolve(insertedRec);
        })
        .catch(function(err) {
          logger.error('Error while creating KMS salt: ', err);
          onResolve({});
        });
    });
  }
}

module.exports = GlobalSalt;
