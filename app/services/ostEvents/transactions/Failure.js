'use strict';
/**
 * This service helps in processing the user activation success event from ost platform
 *
 * Note:-
 */

const rootPrefix = '../../../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  TokenUserByOstUserIdCache = require(rootPrefix + '/lib/cacheManagement/TokenUserByOstUserId'),
  TokenUserDetailByUserIdCache = require(rootPrefix + '/lib/cacheMultiManagement/TokenUserDetailByUserIds'),
  TokenUserModel = require(rootPrefix + '/app/models/mysql/TokenUser'),
  FeedModel = require(rootPrefix + '/app/models/mysql/Feed'),
  UserFeedModel = require(rootPrefix + '/app/models/mysql/UserFeed'),
  ExternalEntityModel = require(rootPrefix + '/app/models/mysql/ExternalEntity'),
  tokenUserConstants = require(rootPrefix + '/lib/globalConstant/tokenUser'),
  feedConstants = require(rootPrefix + '/lib/globalConstant/feed'),
  externalEntityConstants = require(rootPrefix + '/lib/globalConstant/externalEntity'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  SecureTokenData = require(rootPrefix + '/lib/cacheManagement/secureTokenData');

class UserActivationSuccess extends ServiceBase {
  /**
   * @param {Object} params
   * @param {String} params.data: contains the webhook event data
   * @param {String} params.data.user: User entity result from ost
   *
   * @constructor
   */
  constructor(params) {
    super(params);

    const oThis = this;

    oThis.ostTransaction = params.data.transaction;

    oThis.ostTransactionId = oThis.ostTransaction.id;

    oThis.externalEntityObj = null;
  }

  /**
   * perform - Validate Login Credentials
   *
   * @return {Promise<void>}
   */
  async _asyncPerform() {
    const oThis = this;

    await oThis._validateAndSanitizeParams();

    await oThis._fetchExternalEntityObj();

    await oThis._updateExternalEntityObj();

    await oThis._updateOtherEntity();

    return Promise.resolve(responseHelper.successWithData({}));
  }

  /**
   * Validate Request
   *
   *
   * @return {Promise<void>}
   *
   * @private
   */
  async _validateAndSanitizeParams() {
    const oThis = this;

    logger.log('Validate for Transaction Failure Webhook');
    let paramErrors = [];

    if (!CommonValidators.validateEthAddressArray([oThis.ostTransactionFromAddress, oThis.ostTransactionToAddress])) {
      paramErrors.push('invalid_address');
    }

    if (oThis.ostTransactionStatus !== externalEntityConstants.failedOstTransactionStatus) {
      paramErrors.push('invalid_status');
    }

    if (paramErrors.length > 0) {
      return Promise.reject(
        responseHelper.paramValidationError({
          internal_error_identifier: 's_oe_t_f_vas_1',
          api_error_identifier: 'invalid_api_params',
          params_error_identifiers: paramErrors,
          debug_options: {}
        })
      );
    }

    return Promise.resolve(responseHelper.successWithData({}));
  }

  /**
   * Get external Entity Row
   *
   *
   * @return {Promise<void>}
   *
   * @private
   */
  async _fetchExternalEntityObj() {
    const oThis = this;

    logger.log('Fetch external entity for Transaction Failure Webhook');

    let externalEntityGetRes = await new ExternalEntityModel.fetchByEntityKindAndEntityId(
      externalEntityConstants.ostTransactionEntityKind,
      oThis.ostTransactionId
    );

    if (!externalEntityGetRes.id) {
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 's_oe_t_f_feeo_1',
          api_error_identifier: 'resource_not_found'
        })
      );
    }

    oThis.externalEntityObj = externalEntityGetRes;

    return Promise.resolve(responseHelper.successWithData({}));
  }

  /**
   * Update ost transaction status in extra data of external Entity
   *
   *
   * @return {Promise<void>}
   *
   * @private
   */
  async _updateExternalEntityObj() {
    const oThis = this;
    logger.log('Update external entity for Transaction Failure Webhook');

    let extraData = JSON.parse(oThis.externalEntityObj.extraData);
    extraData.ostTransactionStatus = externalEntityConstants.failedOstTransactionStatus;

    await new ExternalEntityModel()
      .update({
        extra_data: JSON.stringify(extraData)
      })
      .where(['id = ?', oThis.externalEntityObj.id])
      .fire();

    oThis.externalEntityObj.parsedExtraData = extraData;

    return Promise.resolve(responseHelper.successWithData({}));
  }

  /**
   * updateOtherEntity as per the transaction
   *
   *
   * @return {Promise<void>}
   *
   * @private
   */
  async _updateOtherEntity() {
    const oThis = this;
    logger.log('Update other entity for Transaction Failure Webhook');

    switch (oThis.externalEntityObj.parsedExtraData.kind) {
      case [externalEntityConstants.extraData.airdropKind]: {
        await oThis._markTokenUserAirdropFailedProperty();
        break;
      }
      case [externalEntityConstants.extraData.userTransactionKind]: {
        await oThis._processUserTransactionFail();
        break;
      }
      default:
        throw new Error(`Unsupported externalEntities.extraData.kind ${oThis.externalEntityObj.parsedExtraData.kind}`);
    }
    return Promise.resolve(responseHelper.successWithData({}));
  }

  /**
   * Update Feeds and User Feed
   *
   *
   * @return {Promise<void>}
   *
   * @private
   */
  async _processUserTransactionFail() {
    const oThis = this;
    logger.log('Process on User Transaction Fail of Transaction Failure Webhook');

    let feedObj = await new FeedModel().fetchByPrimaryExternalEntityId(oThis.externalEntityObj.id);

    if (!feedObj.id) {
      throw `Feed Object not found for externalEntityObj- ${oThis.externalEntityObj}`;
    }

    let userFeedObj = await new UserFeedModel().fetchByFeedId(oThis.externalEntityObj.id);

    if (!userFeedObj.id) {
      throw `User Feed Object not found for externalEntityObj- ${oThis.externalEntityObj}`;
    }

    let published_ts = Math.round(new Date() / 1000);

    await new FeedModel()
      .update({
        published_ts: published_ts,
        status: feedConstants.invertedStatuses[feedConstants.failedStatus]
      })
      .where(['id = ?', feedObj.id])
      .fire();

    await new UserFeedModel()
      .update({
        published_ts: published_ts
      })
      .where(['id = ?', userFeedObj.id])
      .fire();

    await FeedModel.flushCache({ id: feedObj.id });
    await UserFeedModel.flushCache({ id: userFeedObj.id });

    return Promise.resolve(responseHelper.successWithData({}));
  }

  /**
   * Mark Airdrop Failed Property for Token USer
   *
   *
   * @return {Promise<void>}
   *
   * @private
   */
  async _markTokenUserAirdropFailedProperty() {
    const oThis = this;
    logger.log('Update other entity for Transaction Failure Webhook');

    let tokenUserObjRes = await new TokenUserByOstUserIdCache({
      ostUserId: oThis.externalEntityObj.parsedExtraData.toUserIds[0]
    }).fetch();

    if (tokenUserObjRes.isFailure() || !tokenUserObjRes.data.id) {
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 's_oe_t_f_mtuafp_1',
          api_error_identifier: 'resource_not_found'
        })
      );
    }

    let tokenUserObj = tokenUserObjRes.data;

    let propertyVal = tokenUserObj.properties;
    propertyVal = new TokenUserModel().setBitwise('properties', propertyVal, tokenUserConstants.airdropFailedProperty);
    propertyVal = new TokenUserModel().unSetBitwise(
      'properties',
      propertyVal,
      tokenUserConstants.airdropStartedProperty
    );
    propertyVal = new TokenUserModel().unSetBitwise('properties', propertyVal, tokenUserConstants.airdropDoneProperty);

    await new TokenUserModel()
      .update({
        properties: propertyVal
      })
      .where(['id = ?', tokenUserObj.id])
      .fire();

    await TokenUserModel.flushCache({ userId: tokenUserObj.userId });

    return Promise.resolve(responseHelper.successWithData({}));
  }
}

module.exports = UserActivationSuccess;
