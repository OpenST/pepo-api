const mustache = require('mustache'),
  uuidV4 = require('uuid/v4');

const rootPrefix = '.././../..',
  CommonValidator = require(rootPrefix + '/lib/validators/Common'),
  UserNotificationModel = require(rootPrefix + '/app/models/cassandra/UserNotification'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  userNotificationConstants = require(rootPrefix + '/lib/globalConstant/cassandra/userNotification');

/**
 * Class for profile transaction base.
 *
 * @class ProfileTransactionBase
 */
class ProfileTransactionBase {
  /**
   * Constructor for profile transaction base.
   *
   * @param {object} params
   * @param {string/number} params.actorId
   * @param {string/number} params.subjectUserId
   * @param {string} params.transactionId
   *
   * @constructor
   */
  constructor(params) {
    const oThis = this;

    oThis.actorId = params.actorId;
    oThis.subjectUserId = params.subjectUserId;
    oThis.transactionId = params.transactionId;
  }

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

    if (
      CommonValidator.isVarNullOrUndefined(oThis.actorId) ||
      CommonValidator.isVarNullOrUndefined(oThis.subjectUserId) ||
      CommonValidator.isVarNullOrUndefined(oThis.transactionId)
    ) {
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 'l_j_n_pt_b_1',
          api_error_identifier: 'something_went_wrong',
          debug_options: {
            actorId: oThis.actorId,
            subjectUserId: oThis.subjectUserId,
            transactionId: oThis.transactionId
          }
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
      kind: Number(userNotificationConstants.invertedKinds[oThis.kind]),
      landing_vars: JSON.stringify({}),
      subject_user_id: Number(oThis.subjectUserId),
      heading: oThis.heading,
      actor_ids: [oThis.actorId],
      actor_count: 1,
      transaction_id: oThis.transactionId
    };

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
   * Returns heading.
   *
   * @returns {string}
   */
  get heading() {
    const oThis = this;

    return mustache.render(oThis.template.heading, oThis.templateVars);
  }

  /**
   * Returns template.
   *
   * @returns {*}
   */
  get template() {
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

module.exports = ProfileTransactionBase;
