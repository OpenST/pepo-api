'use strict';
/**
 * This service helps in Creating User in our System
 *
 * Note:-
 */

const rootPrefix = '../../..',
  basicHelper = require(rootPrefix + '/helpers/basic'),
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  coreConstants = require(rootPrefix + '/config/coreConstants'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  localCipher = require(rootPrefix + '/lib/encryptors/localCipher'),
  resultType = require(rootPrefix + '/lib/globalConstant/resultType'),
  tokenUserConstants = require(rootPrefix + '/lib/globalConstant/user');

class SignUp extends ServiceBase {
  /**
   * @param {Object} params
   * @param {String} params.user_name: User Name
   * @param {String} params.password: Password
   *
   * @constructor
   */
  constructor(params) {
    super(params);

    const oThis = this;

    oThis.userName = params.user_name;
    oThis.password = params.password;
  }

  /**
   * perform - perform user creation
   *
   * @return {Promise<void>}
   */
  async _asyncPerform() {
    const oThis = this;

    //Check if username exists

    //create salt

    //Create user

    //create ost user

    //Entry in token users
  }

  /**
   * Generate salt for user
   *
   * @returns {Promise<void>}
   *
   * @private
   */
  async _generateUserSalt() {
    const oThis = this;

    let UserSaltEncryptorKeyCache = oThis
        .ic()
        .getShadowedClassFor(coreConstants.icNameSpace, 'UserSaltEncryptorKeyCache'),
      encryptionSaltResp = await new UserSaltEncryptorKeyCache({ tokenId: oThis.tokenId }).fetchDecryptedData();

    let encryptionSalt = encryptionSaltResp.data.encryption_salt_d,
      userSalt = localCipher.generateRandomSalt();

    oThis.userSaltEncrypted = await new AddressesEncryptor({ encryptionSaltD: encryptionSalt }).encrypt(userSalt);
  }

  /**
   * createUser - Creates new user
   *
   * @return {Promise<string>}
   */
  async createUser() {
    const oThis = this;

    let timeInSecs = Math.floor(Date.now() / 1000);

    let params = {
      tokenId: oThis.tokenId,
      userId: oThis.userId,
      kind: oThis.kind,
      salt: oThis.userSaltEncrypted,
      deviceShardNumber: oThis.shardNumbersMap[shardConstants.deviceEntityKind],
      sessionShardNumber: oThis.shardNumbersMap[shardConstants.sessionEntityKind],
      recoveryOwnerShardNumber: oThis.shardNumbersMap[shardConstants.recoveryOwnerAddressEntityKind],
      status: tokenUserConstants.createdStatus,
      updatedTimestamp: timeInSecs
    };

    if (oThis.tokenHolderAddress) {
      params['tokenHolderAddress'] = oThis.tokenHolderAddress;
    }

    if (oThis.multisigAddress) {
      params['multisigAddress'] = oThis.multisigAddress;
    }

    let User = oThis.ic().getShadowedClassFor(coreConstants.icNameSpace, 'UserModel'),
      user = new User({ shardNumber: oThis.userShardNumber });

    let insertRsp = await user.insertUser(params);

    if (insertRsp.isFailure()) {
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 's_u_c_2',
          api_error_identifier: 'error_in_user_creation'
        })
      );
    }

    // NOTE: As base library change the params values, reverse sanitize the data
    return responseHelper.successWithData({ [resultType.user]: user._sanitizeRowFromDynamo(params) });
  }
}

module.exports = SignUp;
