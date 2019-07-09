// const rootPrefix = '../../..',
//   ServiceBase = require(rootPrefix + '/app/services/Base'),
//   UserModel = require(rootPrefix + '/app/models/mysql/User'),
//   KmsWrapper = require(rootPrefix + '/lib/aws/KmsWrapper'),
//   TokenUserModel = require(rootPrefix + '/app/models/mysql/TokenUser'),
//   SecureUserCache = require(rootPrefix + '/lib/cacheManagement/single/SecureUser'),
//   UserByUserNameCache = require(rootPrefix + '/lib/cacheManagement/single/UserByUsername'),
//   TokenUserDetailByUserIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/TokenUserByUserIds'),
//   util = require(rootPrefix + '/lib/util'),
//   responseHelper = require(rootPrefix + '/lib/formatter/response'),
//   userConstants = require(rootPrefix + '/lib/globalConstant/user'),
//   localCipher = require(rootPrefix + '/lib/encryptors/localCipher'),
//   logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
//   kmsGlobalConstant = require(rootPrefix + '/lib/globalConstant/kms'),
//   ostPlatformSdk = require(rootPrefix + '/lib/ostPlatform/jsSdkWrapper'),
//   tokenUserConstants = require(rootPrefix + '/lib/globalConstant/tokenUser');
//
// /**
//  * Class for signup service.
//  *
//  * @class SignUp
//  */
// class SignUp extends ServiceBase {
//   /**
//    * Constructor for signup service.
//    *
//    * @param {object} params
//    * @param {string} params.user_name: User Name
//    * @param {string} params.password: Password
//    * @param {string} params.first_name: First Name
//    * @param {string} params.last_name: Last Name
//    *
//    * @augments ServiceBase
//    *
//    * @constructor
//    */
//   constructor(params) {
//     super(params);
//
//     const oThis = this;
//
//     oThis.userName = params.user_name;
//     oThis.password = params.password;
//     oThis.firstName = params.first_name;
//     oThis.lastName = params.last_name;
//
//     oThis.userId = null;
//     oThis.ostUserId = null;
//     oThis.ostStatus = null;
//     oThis.decryptedEncryptionSalt = null;
//   }
//
//   /**
//    * Perform: Perform user creation.
//    *
//    * @return {Promise<void>}
//    */
//   async _asyncPerform() {
//     const oThis = this;
//
//     // Check if username exists.
//     await oThis._validateAndSanitizeParams();
//
//     await oThis._createUser();
//
//     await oThis._createUserInOst();
//
//     await oThis._createTokenUser();
//
//     return Promise.resolve(oThis._serviceResponse());
//   }
//
//   /**
//    * Validate request.
//    *
//    * @return {Promise<void>}
//    * @private
//    */
//   async _validateAndSanitizeParams() {
//     const oThis = this;
//
//     const userObj = await new UserByUserNameCache({ userName: oThis.userName }).fetch();
//
//     if (userObj.isFailure()) {
//       return Promise.reject(userObj);
//     }
//
//     if (userObj.data.id) {
//       return Promise.reject(
//         responseHelper.paramValidationError({
//           internal_error_identifier: 's_um_su_v_1',
//           api_error_identifier: 'invalid_api_params',
//           params_error_identifiers: ['duplicate_user_name'],
//           debug_options: {}
//         })
//       );
//     }
//
//     return Promise.resolve(responseHelper.successWithData({}));
//   }
//
//   /**
//    * Create user.
//    *
//    * @sets oThis.userId
//    *
//    * @return {Promise<void>}
//    * @private
//    */
//   async _createUser() {
//     const oThis = this;
//
//     const KMSObject = new KmsWrapper(kmsGlobalConstant.userPasswordEncryptionPurpose);
//     const kmsResp = await KMSObject.generateDataKey();
//     const encryptedEncryptionSalt = kmsResp.CiphertextBlob;
//
//     oThis.decryptedEncryptionSalt = kmsResp.Plaintext;
//
//     const encryptedPassword = util.createSha256Digest(decryptedEncryptionSalt, oThis.password);
//
//     let insertData = {
//       user_name: oThis.userName,
//       first_name: oThis.firstName,
//       last_name: oThis.lastName,
//       password: encryptedPassword,
//       encryption_salt: encryptedEncryptionSalt,
//       mark_inactive_trigger_count: 0,
//       properties: 0,
//       status: userConstants.invertedStatuses[userConstants.activeStatus]
//     };
//     // Insert user in database.
//     const insertResponse = await new UserModel().insert(insertData).fire();
//
//     if (!insertResponse) {
//       logger.error('Error while inserting data in users table.');
//       return Promise.reject(new Error('Error while inserting data in users table.'));
//     }
//
//     oThis.userId = insertResponse.insertId;
//     insertData.id = insertResponse.insertId;
//
//     let formattedInsertData = new UserModel().formatDbData(insertData);
//     await UserModel.flushCache(formattedInsertData);
//
//     return Promise.resolve(responseHelper.successWithData({}));
//   }
//
//   /**
//    * Create token user.
//    *
//    * @sets oThis.ostUserId, oThis.ostStatus
//    *
//    * @return {Promise<void>}
//    * @private
//    */
//   async _createUserInOst() {
//     const oThis = this;
//
//     logger.log('Creating user in OST.');
//
//     const createUserServiceResponse = await ostPlatformSdk.createUser();
//     if (!createUserServiceResponse.isSuccess()) {
//       return Promise.reject(createUserServiceResponse);
//     }
//
//     oThis.ostUserId = createUserServiceResponse.data.user.id;
//     oThis.ostStatus = createUserServiceResponse.data.user.status;
//
//     return Promise.resolve(responseHelper.successWithData({}));
//   }
//
//   /**
//    * Create token user
//    *
//    *
//    * @return {Promise<void>}
//    *
//    * @private
//    */
//   async _createTokenUser() {
//     const oThis = this;
//
//     logger.log('Creating token user.');
//     const KMSObject = new KmsWrapper(kmsGlobalConstant.tokenUserScryptSaltPurpose);
//     const kmsResp = await KMSObject.generateDataKey();
//     const decryptedEncryptionSalt = kmsResp.Plaintext,
//       encryptedEncryptionSalt = kmsResp.CiphertextBlob,
//       scryptSalt = localCipher.generateRandomIv(32);
//
//     const encryptedScryptSalt = localCipher.encrypt(decryptedEncryptionSalt, scryptSalt);
//
//     let insertData = {
//       user_id: oThis.userId,
//       ost_user_id: oThis.ostUserId,
//       ost_token_holder_address: null,
//       scrypt_salt: encryptedScryptSalt,
//       encryption_salt: encryptedEncryptionSalt,
//       properties: 0,
//       ost_status: tokenUserConstants.invertedOstStatuses[oThis.ostStatus.toUpperCase()]
//     };
//     // Insert token user in database.
//     const insertResponse = await new TokenUserModel().insert(insertData).fire();
//
//     if (!insertResponse) {
//       logger.error('Error while inserting data in token_users table.');
//
//       return Promise.reject(new Error('Error while inserting data in token_users table.'));
//     }
//
//     insertData.id = insertResponse.insertId;
//
//     let formattedInsertData = new TokenUserModel().formatDbData(insertData);
//     await TokenUserModel.flushCache(formattedInsertData);
//
//     return Promise.resolve(responseHelper.successWithData({}));
//   }
//
//   /**
//    * Service response.
//    *
//    * @return {Promise<void>}
//    * @private
//    */
//   async _serviceResponse() {
//     const oThis = this;
//
//     const promisesArray = [];
//
//     promisesArray.push(new SecureUserCache({ id: oThis.userId }).fetch());
//     promisesArray.push(new TokenUserDetailByUserIdsCache({ userIds: [oThis.userId] }).fetch());
//
//     const promisesArrayResponse = await Promise.all(promisesArray);
//
//     const secureUserRes = promisesArrayResponse[0];
//     const tokenUserRes = promisesArrayResponse[1];
//
//     const secureUser = secureUserRes.data,
//       tokenUser = tokenUserRes.data[oThis.userId];
//
//     const userLoginCookieValue = new UserModel().getCookieValueFor(secureUser, oThis.decryptedEncryptionSalt, {
//       timestamp: Date.now() / 1000
//     });
//
//     return responseHelper.successWithData({
//       user: new UserModel().safeFormattedData(secureUser),
//       tokenUser: new TokenUserModel().safeFormattedData(tokenUser),
//       userLoginCookieValue: userLoginCookieValue
//     });
//   }
// }
//
// module.exports = SignUp;
