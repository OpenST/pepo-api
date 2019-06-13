const rootPrefix = '../../../..',
  TransactionOstEventBase = require(rootPrefix + '/app/services/ostEvents/transactions/Base'),
  TokenUserModel = require(rootPrefix + '/app/models/mysql/TokenUser'),
  UserFeedModel = require(rootPrefix + '/app/models/mysql/UserFeed'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  tokenUserConstants = require(rootPrefix + '/lib/globalConstant/tokenUser'),
  feedConstants = require(rootPrefix + '/lib/globalConstant/feed'),
  externalEntityConstants = require(rootPrefix + '/lib/globalConstant/externalEntity'),
  userFeedConstants = require(rootPrefix + '/lib/globalConstant/userFeed'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger');

class SuccessTransactionOstEvent extends TransactionOstEventBase {
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
   * Transaction Status
   *
   *
   * @return {String}
   *
   * @private
   */
  _validTransactionStatus() {
    return externalEntityConstants.successOstTransactionStatus;
  }

  /**
   * Transaction Status
   *
   *
   * @return {String}
   *
   * @private
   */
  _feedStatus() {
    return feedConstants.publishedStatus;
  }

  /**
   * Get New Property Val for Token USer
   *
   *
   * @return {Integer}
   *
   * @private
   */
  _getPropertyValForTokenUser(propertyVal) {
    const oThis = this;
    logger.log('Get PropertyVal for Transaction Success Webhook');

    propertyVal = new TokenUserModel().setBitwise('properties', propertyVal, tokenUserConstants.airdropDoneProperty);

    return propertyVal;
  }

  /**
   * Update Feeds and User Feed
   *
   *
   * @return {Promise<void>}
   *
   * @private
   */
  async _processForUserTransaction() {
    const oThis = this;
    logger.log('Process on User Transaction of Transaction Success Webhook');

    await super._processForUserTransaction();

    let insertRsp = await new UserFeedModel()
      .insert({
        user_id: oThis.externalEntityObj.parsedExtraData.toUserIds[0],
        feed_id: oThis.feedObj.id,
        privacy_type: userFeedConstants.invertedPrivacyTypes[oThis.privacyType],
        published_ts: oThis._published_timestamp()
      })
      .fire();

    await UserFeedModel.flushCache({ id: insertRsp.insertId });

    return Promise.resolve(responseHelper.successWithData({}));
  }
}

module.exports = SuccessTransactionOstEvent;
