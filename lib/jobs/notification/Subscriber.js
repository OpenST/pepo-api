const uuidV4 = require('uuid/v4');

const rootPrefix = '../../..',
  UserNotificationModel = require(rootPrefix + '/app/models/cassandra/UserNotification'),
  ParametersFormatter = require(rootPrefix + '/lib/notification/formatter/ParametersFormatter');

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
   * @param {object} params.insertParameters
   * @param {string} params.insertParameters.kind
   * @param {string/number} params.insertParameters.subjectUserId
   * @param {array<string/number>} params.insertParameters.actorIds
   * @param {string/number} params.insertParameters.actorCount
   * @param {string/number} [params.insertParameters.transactionId]
   * @param {string/number} [params.insertParameters.videoId]
   *
   * @constructor
   */
  constructor(params) {
    const oThis = this;

    oThis.publishUserId = params.publishUserId;
    oThis.insertParams = params.insertParameters;
  }

  /**
   * Main performer for class.
   *
   * @returns {Promise<void>}
   */
  async perform() {
    const oThis = this;

    await oThis.insertIntoUserNotificationsTable();
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

    await UserNotificationModel.flushCache({});
  }
}

module.exports = Subscriber;
