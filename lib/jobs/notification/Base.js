const uuidV4 = require('uuid/v4');

const rootPrefix = '.././..',
  CommonValidator = require(rootPrefix + '/lib/validators/Common'),
  UserNotificationModel = require(rootPrefix + '/app/models/cassandra/UserNotification'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  userNotificationConstants = require(rootPrefix + '/lib/globalConstant/cassandra/userNotification');

/**
 * Class for profile transaction base.
 *
 * @class NotificationJobBase
 */
class NotificationJobBase {
  /**
   * Main performer for class.
   *
   * @returns {Promise<void>}
   */
  async perform() {
    const oThis = this;

    await oThis.validateAndSanitize();

    await oThis.insertIntoUserNotificationsTable();
  }

  /**
   * Validate and sanitize.
   *
   * @returns {Promise<void>}
   */
  async validateAndSanitize() {
    const oThis = this;

    const mandatoryParameters = oThis.mandatoryParams;
    const debugOptions = {};

    let missingParameters = false;

    for (const parameterName in mandatoryParameters) {
      const parameterValue = mandatoryParameters[parameterName];
      if (CommonValidator.isVarNullOrUndefined(parameterValue)) {
        debugOptions[parameterName] = parameterValue;
        missingParameters = true;
      }
    }

    if (missingParameters) {
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 'l_j_n_pt_b_1',
          api_error_identifier: 'something_went_wrong',
          debug_options: debugOptions
        })
      );
    }
  }

  /**
   * Insert into user notifications table.
   *
   * @returns {Promise<void>}
   */
  async insertIntoUserNotificationsTable() {
    const oThis = this;

    const insertParams = {
      user_id: Number(oThis.actorId),
      last_action_timestamp: Math.floor(Date.now() / 1000),
      uuid: oThis.uuid,
      kind: Number(userNotificationConstants.invertedKinds[oThis.kind])
    };

    Object.assign(insertParams, oThis.specificInsertParams);

    await new UserNotificationModel().insert(insertParams);
  }

  /**
   * Returns UUIDv4.
   *
   * @returns {string}
   */
  get uuid() {
    return uuidV4();
  }

  /**
   * Returns class job specific insert parameters.
   *
   * @returns {{}}
   */
  get specificInsertParams() {
    return {};
  }

  /**
   * Return mandatory parameters.
   *
   * @returns {object}
   */
  get mandatoryParams() {
    throw new Error('Sub-class to implement.');
  }

  /**
   * Returns kind of notification.
   *
   * @returns {string}
   */
  get kind() {
    throw new Error('Sub-class to implement.');
  }

  /**
   * Returns template variables.
   *
   * @returns {object}
   */
  get templateVars() {
    throw new Error('Sub-class to implement.');
  }
}

module.exports = NotificationJobBase;
