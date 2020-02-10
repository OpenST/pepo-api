const rootPrefix = '../../../..',
  KmsWrapper = require(rootPrefix + '/lib/aws/KmsWrapper'),
  ModelBase = require(rootPrefix + '/app/models/mysql/Base'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  databaseConstants = require(rootPrefix + '/lib/globalConstant/database'),
  globalSaltConstants = require(rootPrefix + '/lib/globalConstant/big/globalSalt');

// Declare variables.
const dbName = databaseConstants.bigDbName;

/**
 * Class for global salt model.
 *
 * @class GlobalSaltModel
 */
class GlobalSaltModel extends ModelBase {
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
      .where({
        id: id,
        status: globalSaltConstants.invertedStatuses[globalSaltConstants.activeStatus]
      })
      .fire();
  }

  /**
   * Get encryption salt by kind.
   *
   * @param {string} kind
   *
   * @returns {Promise<any>}
   */
  async getByKind(kind) {
    const oThis = this;

    const kindInt = globalSaltConstants.invertedKinds[kind];

    return oThis
      .select('*')
      .where({
        kind: kindInt,
        status: globalSaltConstants.invertedStatuses[globalSaltConstants.activeStatus]
      })
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
              salt: addressSalt,
              status: globalSaltConstants.invertedStatuses[globalSaltConstants.activeStatus]
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

module.exports = GlobalSaltModel;
