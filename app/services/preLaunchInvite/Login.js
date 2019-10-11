const rootPrefix = '../../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  SecurePreLaunchInviteCache = require(rootPrefix + '/lib/cacheManagement/single/SecurePreLaunchInvite'),
  PreLaunchInviteModel = require(rootPrefix + '/app/models/mysql/PreLaunchInvite'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  preLaunchInviteConstants = require(rootPrefix + '/lib/globalConstant/preLaunchInvite'),
  localCipher = require(rootPrefix + '/lib/encryptors/localCipher'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  coreConstants = require(rootPrefix + '/config/coreConstants');

/**
 * Class for Pre Launch Twitter Login service.
 *
 * @class PreLaunchTwitterLogin
 */
class PreLaunchTwitterLogin extends ServiceBase {
  /**
   * Constructor for PreLaunch Twitter Login service.
   *
   * @param {object} params
   * @param {string} params.preLaunchInviteId: preLaunchInvite Table Id
   * @param {string} params.userTwitterEntity: User Entity Of Twitter
   * @param {string} params.token: Oauth User Token
   * @param {string} params.secret: Oauth User secret
   *
   * @augments ServiceBase
   *
   * @constructor
   */
  constructor(params) {
    super(params);

    const oThis = this;

    oThis.preLaunchInviteId = params.preLaunchInviteId;
    oThis.userTwitterEntity = params.userTwitterEntity;
    oThis.token = params.token;
    oThis.secret = params.secret;

    oThis.securePreLaunchInviteObj = null;

    oThis.decryptedEncryptionSalt = null;
  }

  /**
   * Perform: Perform preLaunchInvite login.
   *
   * @return {Promise<void>}
   */
  async _asyncPerform() {
    const oThis = this;

    logger.log('Start::_asyncPerform PreLaunchInvite Twitter login');

    const promisesArray = [];

    const updatePreLaunchInvitePromise = oThis._fetchSecurePreLaunchInvite().then(function() {
      return oThis._updateTwitterSecrets();
    });

    promisesArray.push(updatePreLaunchInvitePromise);

    await Promise.all(promisesArray);

    logger.log('End::_asyncPerform PreLaunchInvite Twitter Login');

    return Promise.resolve(oThis._serviceResponse());
  }

  /**
   * Fetch Secure preLaunchInvite Obj.
   *
   * @sets oThis.securePreLaunchInviteObj
   *
   * @return {Promise<Result>}
   *
   * @private
   */
  async _fetchSecurePreLaunchInvite() {
    const oThis = this;

    logger.log('Start::Fetching Secure PreLaunchInvite for Twitter login');

    const securePreLaunchInviteRes = await new SecurePreLaunchInviteCache({ id: oThis.preLaunchInviteId }).fetch();

    if (securePreLaunchInviteRes.isFailure()) {
      return Promise.reject(securePreLaunchInviteRes);
    }

    oThis.securePreLaunchInviteObj = securePreLaunchInviteRes.data;

    if (
      !oThis.securePreLaunchInviteObj.id ||
      oThis.securePreLaunchInviteObj.status == preLaunchInviteConstants.blockedStatus
    ) {
      return Promise.reject(
        responseHelper.paramValidationError({
          internal_error_identifier: 's_pli_c_fsu_1',
          api_error_identifier: 'invalid_api_params',
          params_error_identifiers: ['user_not_active'],
          debug_options: {}
        })
      );
    }

    oThis.decryptedEncryptionSalt = localCipher.decrypt(
      coreConstants.CACHE_SHA_KEY,
      oThis.securePreLaunchInviteObj.encryptionSaltLc
    );

    logger.log('End::Fetching Secure PreLaunchInvite for Twitter login');

    return responseHelper.successWithData({});
  }

  /**
   * Update Twitter PreLaunchInvite Extended object twitter credentials and status.
   *
   * @return {Promise<Result>}
   * @private
   */
  async _updateTwitterSecrets() {
    const oThis = this;
    logger.log('Start::Update PreLaunchInvite for login', oThis.securePreLaunchInviteObj);

    const eSecretKms = localCipher.encrypt(oThis.decryptedEncryptionSalt, oThis.secret);

    await new PreLaunchInviteModel()
      .update({
        token: oThis.token,
        secret: eSecretKms
      })
      .where({ id: oThis.securePreLaunchInviteObj.id })
      .fire();

    await PreLaunchInviteModel.flushCache({
      id: oThis.securePreLaunchInviteObj.id
    });

    logger.log('End::Update PreLaunchInvite for login');

    return responseHelper.successWithData({});
  }

  /**
   * Service response.
   *
   * @return {Promise<void>}
   * @private
   */
  async _serviceResponse() {
    const oThis = this;

    logger.log('Start::Service Response for PreLaunchInvite twitter Login');

    const preLaunchInviteLoginCookieValue = new PreLaunchInviteModel().getCookieValueFor(
      oThis.securePreLaunchInviteObj,
      oThis.decryptedEncryptionSalt,
      {
        timestamp: Date.now() / 1000
      }
    );

    logger.log('End::Service Response for PreLaunchInvite twitter Login');

    const safeFormattedPreLaunchInviteData = new PreLaunchInviteModel().safeFormattedData(
      oThis.securePreLaunchInviteObj
    );

    return responseHelper.successWithData({
      preLaunchInvite: safeFormattedPreLaunchInviteData,
      preLaunchInviteLoginCookieValue: preLaunchInviteLoginCookieValue
    });
  }
}

module.exports = PreLaunchTwitterLogin;
