const uuidV4 = require('uuid/v4');

const rootPrefix = '../../..',
  UserNotificationModel = require(rootPrefix + '/app/models/cassandra/UserNotification'),
  ParametersFormatter = require(rootPrefix + '/lib/notification/formatter/ParametersFormatter'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  userNotificationConstants = require(rootPrefix + '/lib/globalConstant/cassandra/userNotification');

/**
 * Class for notification subscriber.
 *
 * @class Subscriber
 */
class Subscriber {
  /**
   * Constructor for notification subscriber.
   *
   * @param {object} params
   * @param {string/number} params.publishUserId
   * @param {object} params.insertParams
   * @param {string} params.insertParams.kind
   * @param {string/number} params.insertParams.subjectUserId
   * @param {array<string/number>} params.insertParams.actorIds
   * @param {string/number} params.insertParams.actorCount
   * @param {object} [params.insertParams.payload]
   * @param {string/number} [params.insertParams.payload.transactionId]
   * @param {string/number} [params.insertParams.payload.videoId]
   * @param {string/number} [params.insertParams.payload.amount]
   *
   * @constructor
   */
  constructor(params) {
    const oThis = this;

    oThis.publishUserId = params.publishUserId;
    oThis.insertParams = params.insertParams;
  }

  /**
   * Main performer for class.
   *
   * @returns {Promise<void>}
   */
  async perform() {
    const oThis = this;

    const validationResponse = oThis.validateAndSanitize();

    if (validationResponse.isFailure()) {
      return Promise.reject(validationResponse);
    }

    await oThis.insertIntoUserNotificationsTable();
  }

  /**
   * Validate input parameters.
   *
   * @returns {result}
   */
  validateAndSanitize() {
    const oThis = this;

    if (!oThis.insertParams.kind || !userNotificationConstants.invertedKinds[oThis.insertParams.kind]) {
      return responseHelper.error({
        internal_error_identifier: 'l_j_n_s_1',
        api_error_identifier: 'something_went_wrong',
        debug_options: { insertParams: oThis.insertParams }
      });
    }

    if (!oThis.publishUserId) {
      return responseHelper.error({
        internal_error_identifier: 'l_j_n_s_2',
        api_error_identifier: 'something_went_wrong',
        debug_options: { publishUserId: oThis.publishUserId }
      });
    }

    return responseHelper.successWithData({});
  }

  /**
   * Insert into user notifications table.
   *
   * @returns {Promise<void>}
   */
  async insertIntoUserNotificationsTable() {
    const oThis = this;

    const mandatoryInsertParams = {
      userId: oThis.publishUserId,
      lastActionTimestamp: Date.now(),
      uuid: uuidV4(),
      headingVersion: 1
    };

    Object.assign(mandatoryInsertParams, oThis.insertParams);

    const formattedResponse = ParametersFormatter.getInsertionParametersForKind(mandatoryInsertParams);
    if (formattedResponse.isFailure()) {
      return Promise.reject(formattedResponse);
    }

    const formattedInsertParams = formattedResponse.data.insertParameters;

    await new UserNotificationModel().insert(formattedInsertParams);

    await UserNotificationModel.flushCache(mandatoryInsertParams);
  }
}

module.exports = Subscriber;
